import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../components/ui/Button';

// @testing-library/react-native v14 made `render` async — see AGENTS.md.
describe('Button', () => {
  it('renders its label and fires onPress', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<Button label="Publish" onPress={onPress} />);
    fireEvent.press(getByText('Publish'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not render its label while loading (shows a spinner instead)', async () => {
    const onPress = jest.fn();
    const { queryByText } = await render(<Button label="Publish" onPress={onPress} loading />);
    expect(queryByText('Publish')).toBeNull();
  });

  it('exposes an accessible role and label for screen readers', async () => {
    const { getByRole } = await render(<Button label="Save Draft" onPress={() => {}} />);
    expect(getByRole('button', { name: 'Save Draft' })).toBeTruthy();
  });
});
