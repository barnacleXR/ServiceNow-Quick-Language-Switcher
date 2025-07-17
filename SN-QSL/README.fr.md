[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [Français](README.fr.md)

# ServiceNow Quick Language Switcher (QLS)

Une extension de navigateur qui ajoute un bouton à l'en-tête de l'interface utilisateur Polaris de ServiceNow, permettant aux utilisateurs de basculer rapidement entre les langues installées.

> **Note de compatibilité**: Cette extension est conçue exclusivement pour l'interface utilisateur **Next Experience** et ne prend pas en charge l'interface utilisateur classique (UI16).

---

### Fonctionnalités

-   **Intégration transparente**: Ajoute une icône de changement de langue directement dans l'en-tête de ServiceNow pour un accès facile.
-   **Changement intelligent**:
    -   Si **deux langues** sont configurées, le bouton agit comme un interrupteur en un clic vers l'autre langue.
    -   Si **plus de deux langues** sont disponibles, une fenêtre modale simple et claire apparaît, vous permettant de choisir dans la liste.
-   **Détection automatique de la langue**: L'extension récupère automatiquement les langues disponibles depuis votre panneau de préférences ServiceNow.
-   **Gestion des erreurs**: Fournit un retour clair à l'utilisateur si l'instance ServiceNow n'a pas plusieurs langues activées.

### Motivation

Pour les développeurs ServiceNow travaillant dans un environnement multilingue, changer fréquemment de langue via le profil utilisateur est un processus fastidieux. Bien que des outils comme `sn-utils` offrent une approche par ligne de commande (`/lang <code_langue>`), cela nécessite toujours une saisie manuelle. Cette extension a été créée pour rationaliser ce flux de travail en une solution simple, en un seul clic, éliminant le besoin d'étapes manuelles répétitives.

### Comment ça marche

L'extension est composée d'un script de contenu qui injecte des éléments d'interface utilisateur et d'un script d'arrière-plan qui gère la logique de base, contournant les limitations du bac à sable (sandbox).

1.  **Injection de l'UI (`content-script.js`)**:
    -   Un `MutationObserver` attend que l'en-tête Polaris de ServiceNow se charge.
    -   Une fois l'en-tête prêt, une nouvelle icône de changement de langue (`<now-icon icon="translated-text-fill">`) est injectée dans la zone de contrôle de l'en-tête.
    -   Ce script écoute les clics sur la nouvelle icône. Lorsqu'elle est cliquée, il envoie un message au script d'arrière-plan pour récupérer la liste des langues disponibles.
    -   Si plus de deux langues sont renvoyées, il crée et affiche dynamiquement une fenêtre modale de sélection de langue en utilisant les styles de `custom-modal.css`.

2.  **Logique de base (`background.js`)**:
    -   Le script d'arrière-plan écoute les messages du script de contenu.
    -   **Récupération des langues**: Lorsqu'une requête `getLanguages` est reçue, il utilise l'API `chrome.scripting.executeScript` pour exécuter une fonction (`getAvailableLanguages`) dans le monde `MAIN` de la page afin d'automatiser l'interface utilisateur et de récupérer la liste des langues.
    -   **Définition de la langue**: Lorsqu'une requête `setLanguage` (avec un ID de langue cible) est reçue, il injecte une autre fonction (`switchLanguageTo`) qui envoie une requête `PUT` à l'API interne de ServiceNow (`/api/now/ui/concoursepicker/language`) pour changer la langue de la session, puis recharge la page.

### Installation

1.  Téléchargez ou clonez ce dépôt.
2.  Ouvrez Google Chrome et accédez à `chrome://extensions/`.
3.  Activez le "**Mode développeur**" à l'aide de l'interrupteur en haut à droite.
4.  Cliquez sur le bouton "**Charger l'extension non empaquetée**".
5.  Sélectionnez le répertoire où vous avez enregistré ces fichiers (`SN-QLS` ou votre dossier de projet).
6.  L'extension est maintenant installée et sera active sur les pages ServiceNow.
