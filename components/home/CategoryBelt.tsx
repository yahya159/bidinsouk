'use client';

import { useState } from 'react';
import {
  Container,
  ScrollArea,
  Group,
  UnstyledButton,
  Text,
  Box,
  Tooltip,
  Menu,
} from '@mantine/core';
import { categoryIcons, type CategoryKey } from '@/lib/iconMap';
import { mockCategories } from '@/lib/homeData';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';

interface CategoryChipProps {
  category: {
    id: string;
    name: string;
    slug: string;
    color: string;
  };
  isActive?: boolean;
  onClick: () => void;
  onSaveSearch: () => void;
}

function CategoryChip({ category, isActive, onClick, onSaveSearch }: CategoryChipProps) {
  const IconComponent = categoryIcons[category.name as CategoryKey];

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <Tooltip label={category.name} position="bottom">
          <UnstyledButton
            onClick={onClick}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              padding: '12px 16px',
              borderRadius: '50px',
              backgroundColor: isActive ? category.color + '20' : 'white',
              border: isActive ? `2px solid ${category.color}` : '2px solid rgba(0,0,0,0.08)',
              minWidth: 100,
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                backgroundColor: category.color + '10',
              },
            }}
          >
            <Box
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: category.color + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {IconComponent && <IconComponent size={18} color={category.color} />}
            </Box>
            <Text size="xs" fw={500} ta="center" style={{ color: isActive ? category.color : '#495057' }}>
              {category.name}
            </Text>
          </UnstyledButton>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item onClick={onClick}>
          Voir la catégorie
        </Menu.Item>
        <Menu.Item onClick={onSaveSearch}>
          Ajouter à la recherche sauvegardée
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export function CategoryBelt() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleCategoryClick = (category: typeof mockCategories[0]) => {
    setActiveCategory(category.id);
    router.push(`/search?category=${category.slug}`);
  };

  const handleSaveSearch = (category: typeof mockCategories[0]) => {
    notifications.show({
      title: 'Recherche sauvegardée',
      message: `La catégorie "${category.name}" a été ajoutée à vos recherches sauvegardées`,
      color: 'green',
    });
  };

  return (
    <Box style={{ backgroundColor: '#fafbfc', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
      <Container size="xl" py="md">
        <ScrollArea>
          <Group gap="md" wrap="nowrap" style={{ minWidth: 'max-content' }}>
            {mockCategories.map((category) => (
              <CategoryChip
                key={category.id}
                category={category}
                isActive={activeCategory === category.id}
                onClick={() => handleCategoryClick(category)}
                onSaveSearch={() => handleSaveSearch(category)}
              />
            ))}
          </Group>
        </ScrollArea>
      </Container>
    </Box>
  );
}