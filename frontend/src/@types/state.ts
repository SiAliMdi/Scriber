import { User } from './user';

type SliceState = { loading: boolean, user: User, error: boolean | null};

export type { SliceState };