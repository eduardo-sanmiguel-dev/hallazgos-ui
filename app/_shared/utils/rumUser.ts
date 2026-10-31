interface UserIdentity {
  id: number;
  name: string;
  email: string;
}

interface IdentityStore {
  getState: () => UserIdentity;
  subscribe: (
    listener: (state: UserIdentity, previous: UserIdentity) => void,
  ) => () => void;
}

interface RumIdentityClient {
  setUser: (user: { id: string; name: string; email: string }) => void;
  clearUser: () => void;
}

/** Conserva la identidad al restaurar la sesión y al actualizar el perfil. */
export const syncRumUser = (store: IdentityStore, rum: RumIdentityClient) => {
  const identify = ({ id, name, email }: UserIdentity) => {
    if (id) rum.setUser({ id: String(id), name, email });
    else rum.clearUser();
  };

  identify(store.getState());
  return store.subscribe((state, previous) => {
    if (
      state.id !== previous.id ||
      state.name !== previous.name ||
      state.email !== previous.email
    ) {
      identify(state);
    }
  });
};
