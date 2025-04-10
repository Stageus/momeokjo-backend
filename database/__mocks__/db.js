module.exports = {
  connect: jest.fn().mockReturnValue({
    query: jest.fn(),
    release: jest.fn(),
  }),
};
