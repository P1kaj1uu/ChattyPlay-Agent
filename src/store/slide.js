const state = {
  currentMenu: '/home/music'
}

const mutations = {
  setCurrentMenu (state, currentMenu) {
    state.currentMenu = currentMenu
  }
}

const actions = {}

const getters = {
  currentMenu: (state) => state.currentMenu
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
