# Design System - Mantine UI

This project uses **Mantine UI v7** as its design system.

## Overview

Mantine is a modern, feature-rich React component library that provides:
- 100+ customizable components
- Built-in hooks for common functionality
- Form management with validation
- Notifications system
- Dark mode support
- TypeScript support
- Excellent accessibility

## Documentation

Official Mantine documentation: https://mantine.dev/

## Getting Started

### Using Components

Import components from `@mantine/core`:

```tsx
import { Button, Card, TextInput } from '@mantine/core';

export function MyComponent() {
  return (
    <Card>
      <TextInput label="Email" placeholder="your@email.com" />
      <Button>Submit</Button>
    </Card>
  );
}
```

### Common Components

#### Layout
- `Container` - Responsive container with max-width
- `Grid` / `Grid.Col` - 12-column responsive grid
- `Stack` - Vertical layout with spacing
- `Group` - Horizontal layout with spacing
- `Paper` - Card-like container with background

#### Forms
- `TextInput` - Text input field
- `NumberInput` - Number input with controls
- `Textarea` - Multi-line text input
- `Select` - Dropdown select
- `Checkbox` - Checkbox input
- `Radio` - Radio button
- `Switch` - Toggle switch

#### Buttons
- `Button` - Primary button component
- `ActionIcon` - Icon-only button

#### Display
- `Badge` - Label/tag component
- `Avatar` - User avatar
- `Card` - Content card
- `Text` - Styled text component
- `Title` - Heading component

#### Feedback
- `Modal` - Dialog/popup
- `Loader` - Loading spinner
- `Alert` - Alert message

### Notifications

Use the notifications system for user feedback:

```tsx
import { notifications } from '@mantine/notifications';

notifications.show({
  title: 'Success',
  message: 'Your action was successful',
  color: 'green',
});
```

### Hooks

Mantine provides useful hooks:

```tsx
import { useDisclosure, useForm, useMediaQuery } from '@mantine/hooks';

// Modal/drawer state
const [opened, { open, close }] = useDisclosure(false);

// Responsive design
const isMobile = useMediaQuery('(max-width: 768px)');
```

### Forms

Use `@mantine/form` for form management:

```tsx
import { useForm } from '@mantine/form';

const form = useForm({
  initialValues: {
    email: '',
    name: '',
  },
  validate: {
    email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
  },
});
```

### Theme Customization

The theme is configured in `lib/theme.ts`. You can customize:
- Primary color
- Font sizes
- Spacing
- Border radius
- Breakpoints
- Component defaults

### Responsive Design

Mantine components support responsive props:

```tsx
<Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
  {/* Full width on mobile, half on tablet, third on desktop */}
</Grid.Col>
```

### Color Scheme

Access theme colors:
- `blue` (primary)
- `red`, `pink`, `grape`, `violet`, `indigo`
- `cyan`, `teal`, `green`, `lime`, `yellow`, `orange`
- `gray`

### Component Examples

See `components/examples/MantineComponents.tsx` for comprehensive examples of all commonly used components.

## Best Practices

1. **Use semantic HTML**: Mantine components render semantic HTML elements
2. **Accessibility**: Use proper labels, ARIA attributes, and keyboard navigation
3. **Responsive**: Design mobile-first using responsive props
4. **Consistency**: Use theme values instead of hardcoded values
5. **Performance**: Import only the components you need
6. **TypeScript**: Take advantage of strong typing

## Migration Notes

This project was migrated from shadcn/ui + Tailwind CSS to Mantine. Key changes:

- Replaced utility classes with Mantine component props
- Use `style` prop for custom inline styles
- Use Mantine's spacing system (`gap`, `p`, `m` props)
- Notifications replace toast system
- Forms use `@mantine/form` instead of react-hook-form + Zod

## Support

For issues or questions:
- Mantine Discord: https://discord.gg/mantine
- GitHub Issues: https://github.com/mantinedev/mantine/issues
- Documentation: https://mantine.dev/
