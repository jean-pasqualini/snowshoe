import request from 'request';

import etagHandler from './etag-handler';
import filter from './result-filter';

const regexp = {
  pagination: /<(.*?)>;\s+rel="next"/g,
};

export default function (token) {
  const defaults = {
    headers: {
      'User-Agent': 'request',
      Accept: 'application/vnd.github.black-cat-preview+json',
      Authorization: `token ${token}`,
    },
  };

  function call(url, type) {
    const result = {};

    return new Promise((resolve, reject) => {
      etagHandler.getEtag(url + token, (etag) => {
        const options = Object.assign({}, defaults, { url });
        const onResponse = (error, response, body) => {
          let message;

          if (error) {
            return reject(error);
          }

          if (response.statusCode < 200 || response.statusCode >= 400) {
            message = 'Github API Error: ';
            message += `${response.statusCode} `;
            message += `${response.statusMessage}. `;
            message += JSON.parse(body).message;

            return reject(new Error(message));
          }
          // Store the results
          result.headers = response.headers;

          if (response.statusCode === 304 && etag) {
            result.json = etag.json;
          } else {
            try {
              result.json = filter(JSON.parse(body), type);
              etagHandler.store(url + token, result.json, response.headers);
            } catch (error) { // eslint-disable-line no-shadow
              error.message += `. Could not parse body: ${body}`;

              return reject(new Error(error));
            }
          }

          return resolve(result);
        };

        if (etag) {
          options.headers['If-None-Match'] = etag.etag;
        }

        request(options, onResponse);
      });
    });
  }

  function paginate(url, type) {
    return new Promise((resolve, reject) => {
      const pager = (pageUrl, pageType, result) => {
        call(pageUrl, pageType)
          .then((data) => {
            const resolved = Object.assign({}, result);

            if (!resolved.headers) {
              resolved.headers = data.headers;
            }
            resolved.json = resolved.json.concat(data.json);

            if (data.headers && data.headers.link) {
              const next = regexp.pagination.exec(data.headers.link);
              if (next) {
                return pager(next[1], pageType, resolved);
              }
            }

            // Only resolve if we have no next pages left
            return resolve(resolved);
          })
          .catch((error) => reject(error));
      };

      pager(url, type, { json: [] });
    });
  }

  return {
    call,
    paginate,
  };
}
