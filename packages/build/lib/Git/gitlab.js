const GitServer = require('./GitServer');
const GitLabRequest = require('./gitlabRequest');

class Gitlab extends GitServer {
  constructor() {
    super('gitlab');
  }

  getTokenHelpUrl = () => {
    return 'https://www.csdn.net/tags/NtjaAg4sODQyNzgtYmxvZwO0O0OO0O0O.html';
  };

  getUser = () => {
    // http://gitlab.sumscope.com/api/v4/users/?access_token=5RJCwwrsRyX8vRzLgeSM&username=ming.yan
    return this.request.get('/user').then(response => {
      return this.handleResponse(response);
    });
  };

  setToken = (token) => {
    this.request = new GitLabRequest(token);
  };
  // 获取仓库信息：http://gitlab.sumscope.com/api/v4/projects/?access_token=5RJCwwrsRyX8vRzLgeSM&owned=true&search=history
  getRepo = (repo) => {
    return this.request.get(`projects/?owned=true&search=${repo}`).then(response => {
      return this.handleResponse(response.filter(e=>e.name === repo)[0]);
    });
  };
  getRemote = (host, login, repo) => {
    // ssh://product@gitlab.sumscope.com:2333/primary-centre/web-client/history.git
    return `ssh://product@${host}/primary-centre/mobile-client/mobile-core.git`;
  };

  // api: https://docs.gitlab.com/ee/api/merge_requests.html#create-mr
  creareMergeRequest = () => {

  }
}

module.exports = Gitlab;
