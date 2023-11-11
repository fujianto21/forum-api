/* istanbul ignore file */
const ServerTestHelper = {
  async generateAccessToken(server) {
    const userPayload = {
      username: 'user123',
      password: 'strongpassword',
      fullname: 'User Test',
    };

    const responseAddUser = await server.inject({
      method: 'POST',
      url: '/users',
      payload: userPayload,
    });

    const { addedUser: { id: owner } } = (JSON.parse(responseAddUser.payload)).data;

    const authPayload = {
      username: userPayload.username,
      password: userPayload.password,
    };

    const responseAuth = await server.inject({
      method: 'POST',
      url: '/authentications',
      payload: authPayload,
    });

    const { accessToken } = (JSON.parse(responseAuth.payload)).data;

    return { accessToken, owner };
  },
};

module.exports = ServerTestHelper;
