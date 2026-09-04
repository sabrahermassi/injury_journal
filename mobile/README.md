# Injury Journal — mobile

The Expo / React Native client for the Injury Journal API. See `CLAUDE.md` in this
folder (and root `CLAUDE.md` §12) for the conventions and the shared-API contract with
`frontend/`.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Configure the API URL

   ```bash
   cp .env.example .env.local
   ```

   Set `EXPO_PUBLIC_API_URL` to an address your phone can reach — a LAN IP, not
   `localhost` (on the phone, `localhost` is the phone). That same address must also
   appear in the repo-root `.env`'s comma-separated `FRONTEND_URL`, or the API rejects
   the origin.

3. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

Routes are file-based under `src/app/` (not `app/`) — see [file-based routing](https://docs.expo.dev/router/introduction).

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
