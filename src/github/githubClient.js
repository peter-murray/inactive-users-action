const {throttling} = require('@octokit/plugin-throttling')
  , {retry} = require('@octokit/plugin-retry')
  , {Octokit} = require('@octokit/rest')
;

const RetryThrottlingOctokit = Octokit.plugin(throttling, retry);

//TODO could apply the API endpoint (i.e. support GHES)

module.exports.create = (token, maxRetries) => {
  const MAX_RETRIES = maxRetries ? maxRetries : 3

  const octokit =new RetryThrottlingOctokit({
    auth: `token ${token}`,

    throttle: {
      onRateLimit: (retryAfter, options) => {
        octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
        octokit.log.warn(`  request retries: ${options.request.retryCount}, MAX: ${MAX_RETRIES}`);

        if (options.request.retryCount < MAX_RETRIES) {
          octokit.log.warn(`Retrying after ${retryAfter} seconds.`);
          return true;
        }
      },

      onAbuseLimit: (retryAfter, options) => {
        octokit.log.warn(`Abuse detection triggered request ${options.method} ${options.url}`);
        // Prevent any further activity as abuse trigger has very long periods to come back from
        return false;
        // if (options.request.retryCount < MAX_RETRIES) {
        //   octokit.log.warn(`Retrying after ${retryAfter} seconds`);
        //   return true;
        // }
      }
    }
  });

  return octokit;
}

