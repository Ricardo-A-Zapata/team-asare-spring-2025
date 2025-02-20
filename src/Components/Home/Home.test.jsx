const React = require('react');
const { render, screen, waitFor } = require('@testing-library/react');
const Home = require('./Home').default;
const { BACKEND_URL } = require('../../constants');

jest.mock('axios', () => ({
  get: jest.fn(),
}));

describe('Home Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches and displays the journal name', async () => {
    require('axios').get.mockResolvedValueOnce({ data: { "Journal Name": "Test Journal" } });

    render(<Home />);

    await waitFor(() => expect(screen.getByText(/Welcome to Test Journal/i)).toBeInTheDocument());
  });

  test('displays an error message if fetching fails', async () => {
    require('axios').get.mockRejectedValueOnce(new Error('API failure'));

    render(<Home />);

    await waitFor(() => expect(screen.getByText(/There was a problem retrieving the journal name/i)).toBeInTheDocument());
  });
});
