const CommitActivity = require('./CommitActivity')
  , IssueActivity = require('./IssueActivity')
  , PullRequestActivity = require('./PullRequestActivity')
  , UserActivityAttributes = require('../UserActivityAttributes')

module.exports = class RepositoryActivity {

  constructor(octokit) {
    this._commitActivity = new CommitActivity(octokit)
    this._issueActivity = new IssueActivity(octokit)
    this._pullRequestActivity = new PullRequestActivity(octokit)
  }

  getActivity(repo, since) {
    const owner = repo.owner
      , name = repo.name
      , fullName = repo.full_name
      , commitActivity = this._commitActivity
      , issueActivity = this._issueActivity
      , prActivity = this._pullRequestActivity
      , data = {}
    ;

    //TODO need some validation around the parameters

    return commitActivity.getCommitActivityFrom(owner, name, since)
      .then(commits => {
        data[UserActivityAttributes.COMMITS] = commits[fullName];
        return issueActivity.getIssueActivityFrom(owner, name, since);
      })
      .then(issues => {
        data[UserActivityAttributes.ISSUES] = issues[fullName];
        return issueActivity.getIssueCommentActivityFrom(owner, name, since);
      })
      .then(issueComments => {
        data[UserActivityAttributes.ISSUE_COMMENTS] = issueComments[fullName];
        return prActivity.getPullRequestCommentActivityFrom(owner, name, since);
      })
      .then(prComments => {
        data[UserActivityAttributes.PULL_REQUEST_COMMENTS]= prComments[fullName];

        const results = {}
        results[fullName] = data;
        return results;
      });
  }
}


