export const GAME_VIEW = {
  INFO: 'info',
  PLAY: 'play',
} as const;

export type GameView = (typeof GAME_VIEW)[keyof typeof GAME_VIEW];


export const SOLVER_STATE = {
  IDLE: 'idle',
  COMPUTING: 'computing',
  SOLVING: 'solving',
  DONE: 'done',
} as const;

export type SolverState = (typeof SOLVER_STATE)[keyof typeof SOLVER_STATE];


export const SIDE = {
  LEFT: 'left',
  RIGHT: 'right',
} as const;
export type Side = (typeof SIDE)[keyof typeof SIDE];

export const DIRECTION = {
  UP: 'up',
  DOWN: 'down',
} as const;
export type Direction = (typeof DIRECTION)[keyof typeof DIRECTION];
