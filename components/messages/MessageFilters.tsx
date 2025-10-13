'use client';

import { Group, TextInput, Select, Button, Collapse, ActionIcon } from '@mantine/core';
import { IconSearch, IconFilter, IconX, IconCalendar } from '@tabler/icons-react';
import { useState } from 'react';
import { DateValue } from '@mantine/dates';

interface FiltersState {
  search: string;
  status: string;
  priority: string;
  dateRange: [Date | null, Date | null];
  category: string;
}

interface MessageFiltersProps {
  filters: FiltersState;
  onChange: (filters: FiltersState) => void;
  type: 'support' | 'messages';
}

export const MessageFilters = ({ filters, onChange, type }: MessageFiltersProps) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateRange, setDateRange] = useState<[DateValue, DateValue]>([null, null]);

  // Options de statut
  const statusOptions = [
    { value: 'all', label: 'Tous les états' },
    { value: 'OPEN', label: 'Ouvert' },
    { value: 'IN_PROGRESS', label: 'En cours' },
    { value: 'RESOLVED', label: 'Résolu' },
    { value: 'CLOSED', label: 'Fermé' }
  ];

  // Options de priorité
  const priorityOptions = [
    { value: 'all', label: 'Toutes priorités' },
    { value: 'URGENT', label: 'Urgente' },
    { value: 'HIGH', label: 'Haute' },
    { value: 'NORMAL', label: 'Normale' },
    { value: 'LOW', label: 'Basse' }
  ];

  // Options de catégorie (pour les tickets SAV)
  const categoryOptions = [
    { value: 'all', label: 'Toutes catégories' },
    { value: 'ORDER', label: 'Commande' },
    { value: 'PRODUCT', label: 'Produit' },
    { value: 'TECHNICAL', label: 'Technique' },
    { value: 'OTHER', label: 'Autre' }
  ];

  // Gérer le changement de recherche
  const handleSearchChange = (value: string) => {
    onChange({ ...filters, search: value });
  };

  // Gérer le changement de statut
  const handleStatusChange = (value: string | null) => {
    onChange({ ...filters, status: value || 'all' });
  };

  // Gérer le changement de priorité
  const handlePriorityChange = (value: string | null) => {
    onChange({ ...filters, priority: value || 'all' });
  };

  // Gérer le changement de catégorie
  const handleCategoryChange = (value: string | null) => {
    onChange({ ...filters, category: value || 'all' });
  };

  // Gérer le changement de plage de dates
  const handleDateRangeChange = (dates: [DateValue, DateValue]) => {
    setDateRange(dates);
    onChange({ ...filters, dateRange: [dates[0], dates[1]] });
  };

  // Réinitialiser les filtres
  const handleReset = () => {
    setDateRange([null, null]);
    onChange({
      search: '',
      status: 'all',
      priority: 'all',
      dateRange: [null, null],
      category: 'all'
    });
  };

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = filters.search || 
    filters.status !== 'all' || 
    filters.priority !== 'all' || 
    filters.category !== 'all' ||
    filters.dateRange[0] || 
    filters.dateRange[1];

  return (
    <div>
      {/* Barre de recherche principale */}
      <Group gap="md" mb="sm">
        <TextInput
          placeholder={`Rechercher dans mes ${type === 'support' ? 'demandes' : 'messages'}...`}
          leftSection={<IconSearch size={16} />}
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          style={{ flex: 1, minWidth: 300 }}
        />
        
        <ActionIcon
          variant="light"
          onClick={() => setFiltersOpen(!filtersOpen)}
          color={hasActiveFilters ? 'blue' : 'gray'}
        >
          <IconFilter size={16} />
        </ActionIcon>
        
        {hasActiveFilters && (
          <Button
            variant="subtle"
            size="sm"
            leftSection={<IconX size={14} />}
            onClick={handleReset}
          >
            Effacer
          </Button>
        )}
      </Group>

      {/* Filtres avancés */}
      <Collapse in={filtersOpen}>
        <Group gap="md" p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: '8px' }}>
          <Select
            placeholder="État"
            data={statusOptions}
            value={filters.status}
            onChange={handleStatusChange}
            clearable={false}
            style={{ minWidth: 150 }}
          />
          
          <Select
            placeholder="Priorité"
            data={priorityOptions}
            value={filters.priority}
            onChange={handlePriorityChange}
            clearable={false}
            style={{ minWidth: 150 }}
          />
          
          {type === 'support' && (
            <Select
              placeholder="Catégorie"
              data={categoryOptions}
              value={filters.category}
              onChange={handleCategoryChange}
              clearable={false}
              style={{ minWidth: 150 }}
            />
          )}
          
          <TextInput
            placeholder="Période (à implémenter)"
            leftSection={<IconCalendar size={16} />}
            style={{ minWidth: 200 }}
            disabled
          />
        </Group>
      </Collapse>
    </div>
  );
};