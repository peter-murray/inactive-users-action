const CommitActivity = require('./CommitActivity')
  , IssueActivity = require('./IssueActivity')
  , PullRequestActivity = require('./PullRequestActivity')
  , UserActivityAttributes = require('../UserActivityAttributes')

module.exports = class RepositoryActivity {

  constructor(octokit, core) {
    this._core = core;

    this._commitActivity = new CommitActivity(octokit, core)
    this._issueActivity = new IssueActivity(octokit, core)
    this._pullRequestActivity = new PullRequestActivity(octokit, core)
  }

  async getActivity(repo, since, debug) {
    const owner = repo.owner
      , name = repo.name
      , fullName = repo.full_name
      , commitActivity = this._commitActivity
      , issueActivity = this._issueActivity
      , prActivity = this._pullRequestActivity
      , data = {}
      , core = this._core
    ;

    //TODO need some validation around the parameters

    console.log(`Building repository activity for: ${fullName}...`);

    const commits = await commitActivity.getCommitActivityFrom(owner, name, since, debug);
    data[UserActivityAttributes.COMMITS] = commits[fullName];

    const issues = await issueActivity.getIssueActivityFrom(owner, name, since, debug)
    data[UserActivityAttributes.ISSUES] = issues[fullName];

    const issueComments = await issueActivity.getIssueCommentActivityFrom(owner, name, since, debug);
    data[UserActivityAttributes.ISSUE_COMMENTS] = issueComments[fullName];

    const prComments = await prActivity.getPullRequestCommentActivityFrom(owner, name, since, debug)
    data[UserActivityAttributes.PULL_REQUEST_COMMENTS] = prComments[fullName];

    const results = {};
    results[fullName] = data;

    if (debug) {
      core.startGroup(`complete activity data`);
      core.info(JSON.stringify(results, null, 2));
      core.endGroup();
    }

    console.log(`  completed.`);
    return results;

    // Need to avoid triggering the chain so using async now
    //
    // return commitActivity.getCommitActivityFrom(owner, name, since)
    //   .then(commits => {
    //     data[UserActivityAttributes.COMMITS] = commits[fullName];
    //     return issueActivity.getIssueActivityFrom(owner, name, since);
    //   })
    //   .then(issues => {
    //     data[UserActivityAttributes.ISSUES] = issues[fullName];
    //     return issueActivity.getIssueCommentActivityFrom(owner, name, since);
    //   })
    //   .then(issueComments => {
    //     data[UserActivityAttributes.ISSUE_COMMENTS] = issueComments[fullName];
    //     return prActivity.getPullRequestCommentActivityFrom(owner, name, since);
    //   })
    //   .then(prComments => {
    //     data[UserActivityAttributes.PULL_REQUEST_COMMENTS]= prComments[fullName];
    //
    //     const results = {}
    //     results[fullName] = data;
    //     return results;
    //   });
  }
}


