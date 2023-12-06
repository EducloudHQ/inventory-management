export function request(...args) {
    console.log(args);
    return {}
  }

  // The after step
  export function response(ctx) {
    console.log(ctx.prev.result.items);
    return ctx.prev.result
  }