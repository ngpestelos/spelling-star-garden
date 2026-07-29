/**
 * Static assets + force HTTPS (Workers custom domains still serve http://).
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.protocol === "http:") {
      url.protocol = "https:";
      return Response.redirect(url.href, 301);
    }
    return env.ASSETS.fetch(request);
  },
};
