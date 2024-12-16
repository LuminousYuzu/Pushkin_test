const debug = true;
// The following will be undefined in the local environment
// but are needed to route the API and server correctly for GitHub Codespaces
const codespaces = undefined;
const codespaceName = 'undefined';
module.exports = { debug, codespaces, codespaceName };