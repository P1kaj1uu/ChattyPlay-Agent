const state = {
  token: '',
  userId: ''
}

const mutations = {
  setToken (state, token) {
    state.token = token
  },
  setUserId (state, userId) {
    state.userId = userId
  }
}

const actions = {}

const getters = {
  token: (state) => state.token,
  userId: (state) => state.userId
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
