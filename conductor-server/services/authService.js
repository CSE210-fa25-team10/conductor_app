export const login = async (credentials) => {
    const { email, password } = credentials;
};

export const register = async (userInfo) => {
    const { email, password } = userInfo;
};

export const findOrCreateGoogleUser = async (profile) => {
    const googleId = profile.id;
    const email = profile.emails[0].value;
    const name = profile.displayName;
};

export const findById = async (id) => {
    // Find user by ID in the database
};
