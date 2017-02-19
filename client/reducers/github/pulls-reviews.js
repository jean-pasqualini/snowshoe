export default function pullsReviews(state, action) {
  const ids = action.reviews.map((review) => review.pull_request.id);

  return state.map((pull) => {
    const index = ids.indexOf(pull.id);

    if (index !== -1) {
      return Object.assign(
        {},
        pull,
        {
          reviews: action.reviews[index].reviews,
        }
      );
    }

    return pull;
  });
}
