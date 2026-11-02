# Booking Web

React front end for managing field and pitch bookings: contacts, fields, single, weekly recurring and camp bookings, with overview and calendar views. All pages require login against the booking REST API.

Built with **React 18**, **TypeScript**, **Vite**, **Tailwind CSS 4** and **React Router**.

The code is mostly AI-generated.

A **Nix** flake provides the development environment (**Node 22**, **TypeScript** and its language server). Its inputs are pinned in `flake.lock`, so everyone gets the same tool versions. Run `nix develop` to enter it.
