import { User } from './user';

type SliceState = { loading: boolean, user: User | null, error: boolean | null};

export type { SliceState };