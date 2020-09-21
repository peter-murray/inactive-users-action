const {throttling} = require('@octokit/plugin-throttling')
  , {retry} = require('@octokit/plugin-retry')
  , {Octokit} = require('@octokit/rest')
;

const RetryThrottlingOctokit = Octokit.plugin(throttling, retry);

//TODO could apply the API endpoint (i.e. support GHES)

module.exports.create = (token, maxRetries) => {
  const MAX_RETRIES = maxRetries ? maxRetries : 3

  return new RetryThrottlingOctokit({
    auth: `token ${token}`,

    throttle: {
      onRateLimit: (retryAfter, options) => {
        octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
        if (options.request.retryCount < MAX_RETRIES) {
          octokit.log.warn(`Retrying after ${retryAfter} seconds`);
          return true;
        }
      },

      onAbuseLimit: (retryAfter, options) => {
        octokit.log.warn(`Abuse detection triggered request ${options.method} ${options.url}`);
        if (options.request.retryCount < MAX_RETRIES) {
          octokit.log.warn(`Retrying after ${retryAfter} seconds`);
          return true;
        }
      }
    }
  });
}

