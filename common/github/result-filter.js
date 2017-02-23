import _ from 'lodash';
import picker from './object-picker';

const schemas = {
  repository: ['pulls_url', 'full_name', 'issues_url'],
  team: ['id', 'slug', 'name'],
  organization: ['login'],
  status: [
    'state',
    {
      statuses: ['state', 'target_url', 'context'],
    },
  ],
  issue: [
    'id',
    'comments',
    {
      labels: ['color', 'name'],
    },
    {
      pull_request: 'url',
    },
  ],
  pull: [
    'id',
    {
      base: [{
        repo: ['url', 'name', 'full_name'],
      }],
    },
    {
      user: ['avatar_url', 'login'],
    },
    {
      head: ['sha'],
    },
    'title',
    'html_url',
    'number',
    'updated_at',
    'created_at',
    'url',
    'locked',
  ],
  review: [
    {
      user: ['login'],
    },
    'state',
  ],
  user: [
    'login',
  ],
};

/**
 * Filter the API output by applying the
 * object-picker for the given object type
 *
 * @param  Object data The result to filter
 * @param  string type The object type (must match a defined schema)
 *
 * @return Object      The filtered result
 *
 * @throws Error If No schema defined for the given type
 */
export default function (data, type) {
  const picked = [];

  if (schemas[type] === undefined) {
    throw new Error(`No "${type} schema defined in "config/object/"`);
  }

  if (_.isArray(data)) {
    data.forEach((value) => {
      picked.push(picker(value, schemas[type]));
    });

    return picked;
  }

  return picker(data, schemas[type]);
}
