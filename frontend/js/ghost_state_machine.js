const GHOST_STATE = {
  NORMAL: "normal",
  FRIGHTENED: "frightened",
  EYES: "eyes"
};

const ALLOWED_STATE_TRANSITIONS = {
  [GHOST_STATE.NORMAL]: [GHOST_STATE.FRIGHTENED, GHOST_STATE.EYES],
  [GHOST_STATE.FRIGHTENED]: [GHOST_STATE.NORMAL, GHOST_STATE.EYES],
  [GHOST_STATE.EYES]: [GHOST_STATE.NORMAL]
};

class GhostStateMachine {
  constructor(initialState = GHOST_STATE.NORMAL) {
    this.state = initialState;
  }

  getState() {
    return this.state;
  }

  isNormal() {
    return this.state === GHOST_STATE.NORMAL;
  }

  isFrightened() {
    return this.state === GHOST_STATE.FRIGHTENED;
  }

  isEyes() {
    return this.state === GHOST_STATE.EYES;
  }

  transitionTo(state) {
    if (!Object.values(GHOST_STATE).includes(state)) return false;
    if (state === this.state) return true;
    if (!ALLOWED_STATE_TRANSITIONS[this.state].includes(state)) return false;
    this.state = state;
    return true;
  }

  reset() {
    this.state = GHOST_STATE.NORMAL;
  }
}