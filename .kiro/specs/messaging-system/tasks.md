# Système de Messagerie - Plan de Tâches

## Phase 1: Infrastructure et Modèles de Données

- [x] 1.1 Modèles Prisma et Base de Données
  - Ajouter modèles `MessageThread` et `Message` au schema Prisma
  - Créer les relations avec `User`, `Vendor`, `Product`, `Order`
  - Ajouter les enums pour `ThreadType`, `ThreadStatus`, `Priority`
  - Générer et appliquer les migrations
  - Créer les seeds de données de test

- [x] 1.2 API Endpoints - Threads
  - `GET /api/messages/threads` - Liste paginée avec filtres
  - `POST /api/messages/threads` - Créer nouveau fil
  - `GET /api/messages/threads/[id]` - Détails d'un fil
  - `PUT /api/messages/threads/[id]` - Mettre à jour fil
  - `DELETE /api/messages/threads/[id]` - Supprimer fil
  - Validation des données avec Zod
  - Gestion des permissions utilisateur

- [x] 1.3 API Endpoints - Messages
  - `GET /api/messages/threads/[id]/messages` - Messages d'un fil
  - `POST /api/messages/threads/[id]/messages` - Envoyer message
  - `PUT /api/messages/threads/[id]/read` - Marquer comme lu
  - `POST /api/messages/attachments` - Upload fichiers
  - Gestion des notifications en temps réel

## Phase 2: Interface Utilisateur - Structure

- [x] 2.1 Page Principale et Navigation
  - Créer `app/(pages)/messages/page.tsx`
  - Implémenter les onglets "Mes demandes" et "Mes messages"
  - Ajouter navigation dans le header principal
  - Gérer les badges de notification
  - Layout responsive

- [x] 2.2 Composant Liste des Fils
  - Composant `MessageThreadList`
  - Composant `ThreadCard` avec états visuels
  - Pagination ou scroll infini
  - Gestion du loading et états vides
  - Sélection active et navigation

- [x] 2.3 Barre de Filtres et Recherche
  - Composant `MessageFilters`
  - Champ de recherche avec debounce
  - Filtres par état, priorité, date
  - Sauvegarde des préférences
  - Reset et clear des filtres

## Phase 3: Interface Utilisateur - Conversation

- [x] 3.1 Vue Conversation
  - Composant `ConversationView`
  - En-tête avec informations du fil
  - Zone de messages avec scroll
  - Composant `MessageBubble`
  - Gestion des timestamps et statuts

- [x] 3.2 Composer de Messages
  - Composant `MessageComposer`
  - Éditeur de texte avec formatage
  - Upload et prévisualisation de fichiers
  - Raccourcis clavier (Entrée pour envoyer)
  - États de chargement et erreurs

- [x] 3.3 Gestion des Pièces Jointes
  - Composant `AttachmentUpload`
  - Prévisualisation des fichiers
  - Validation des types et tailles
  - Stockage sécurisé des fichiers
  - Téléchargement des pièces jointes

## Phase 4: Fonctionnalités Avancées

- [x] 4.1 Modals de Création
  - `CreateTicketModal` pour les tickets SAV
  - `CreateMessageModal` pour les messages vendeurs
  - Validation des formulaires
  - Gestion des erreurs

- [ ] 4.2 Système de Notifications
  - WebSocket ou Server-Sent Events
  - Notifications push dans l'interface
  - Badges de comptage non lus
  - Notifications email configurables
  - Marquage automatique comme lu

- [ ] 4.3 Recherche Avancée
  - Recherche full-text dans le contenu
  - Filtres combinés avancés
  - Sauvegarde de recherches
  - Suggestions de recherche
  - Export des résultats

## Phase 5: Optimisation et Tests

- [ ] 5.1 Tests et Validation
  - Tests unitaires des composants
  - Tests d'intégration API
  - Tests e2e des workflows
  - Tests de performance
  - Tests d'accessibilité

- [ ] 5.2 Optimisation Performance
  - Virtualisation des longues listes
  - Cache des conversations récentes
  - Lazy loading des images
  - Optimisation des requêtes DB
  - Compression des assets

- [ ] 5.3 Documentation et Formation
  - Guide utilisateur illustré
  - FAQ sur la messagerie
  - Documentation API
  - Guide d'administration
  - Vidéos de démonstration

## Récapitulatif

**Total estimé**: ~58 heures
**Phases**: 5
**Tâches**: 15
**Priorité haute**: 8 tâches
**Priorité moyenne**: 5 tâches
**Priorité basse**: 2 tâches

**Statut actuel**: Phase 1-3 complétées (Infrastructure et UI de base)
**Prochaines étapes**: Phase 4 (Fonctionnalités avancées)