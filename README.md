# 👶 Cuidador App

A React Native application designed to help caregivers manage and track baby care activities. Built with Expo and modern React Native technologies.

## 🚀 Features

- **User Authentication**: Sign in/Sign up, password reset and profile completion powered by Supabase
- **Baby Management**: Create, list and edit baby profiles with detailed records
- **Multi-language Support**: Available in English, Spanish, and Portuguese
- **Chat Interface**: Conversational assistant with markdown responses, rendered tables and feedback capture
- **Modern UI**: Built with NativeWind (Tailwind CSS for React Native)
- **Cross-platform**: Runs on iOS, Android, and Web

## 🛠️ Tech Stack

- **React Native**: 0.79.5
- **Expo**: ~53.0.20
- **React Navigation**: Stack navigation
- **Supabase**: Backend and authentication
- **NativeWind**: Styling with Tailwind CSS
- **React i18next**: Internationalization

## 📱 Screenshots

*Screenshots will be added soon*

## 🏗️ Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cuidador-app.git
   cd cuidador-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

## 🚀 Running the App

### Development

```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web browser
npm run web
```

### Production Build

```bash
# Build for production
expo build:android
expo build:ios
```

### Deploy
```bash
# Build for preview
eas build -p ios --profile preview 
eas update --platform ios
```

## 📁 Project Structure

```
cuidador-app/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── CommentModal.jsx
│   │   ├── FeedbackModal.jsx
│   │   ├── Input.jsx
│   │   ├── PhoneInput.jsx
│   │   ├── TableView.jsx
│   │   └── chat/
│   │       ├── AssistantMessage.jsx
│   │       ├── LoadingMessage.jsx
│   │       ├── MarkdownText.jsx
│   │       └── UserMessage.jsx
│   ├── contexts/            # React contexts
│   │   └── AuthContext.jsx
│   ├── lib/                 # Utilities and configurations
│   │   ├── 18n.js           # Internationalization setup
│   │   └── supabase.js      # Supabase configuration
│   ├── locales/             # Translation files
│   │   ├── en.json
│   │   ├── es.json
│   │   └── pt.json
│   ├── navigation/          # Navigation configuration
│   │   └── AppNavigator.js
│   ├── services/            # API services
│   │   ├── BabiesService.js
│   │   ├── ConversationsService.js
│   │   ├── FeedbackService.js
│   │   └── ProfilesService.js
│   └── views/               # Screen components
│       ├── Babies.jsx
│       ├── BabyDetail.jsx
│       ├── Chat.jsx
│       ├── CompleteProfile.jsx
│       ├── ForgotPassword.jsx
│       ├── Home.jsx
│       ├── ListBabies.jsx
│       ├── ProfileSettings.jsx
│       ├── ResetPassword.jsx
│       ├── SignIn.jsx
│       └── SignUp.jsx
├── assets/                  # Static assets
├── App.js                   # Main app component
├── app.json                 # Expo configuration
└── package.json             # Dependencies and scripts
```

## 🖥️ Key Screens

- **Home.jsx**: Dashboard with quick actions and contextual guidance for caregivers
- **Babies.jsx / BabyDetail.jsx**: Full CRUD flow to manage baby records and review specific details
- **Chat.jsx**: Conversational assistant view leveraging the reusable chat component suite
- **CompleteProfile.jsx & ProfileSettings.jsx**: Guided flows to complete and update caregiver information
- **Auth Screens**: `SignIn.jsx`, `SignUp.jsx`, `ForgotPassword.jsx`, and `ResetPassword.jsx` for the authentication journey

## 🌐 Internationalization

The app supports multiple languages:
- **English** (en)
- **Spanish** (es) 
- **Portuguese** (pt)

Language files are located in `src/locales/`. The app automatically detects the device language and falls back to English if the language is not supported.

## 🔧 Configuration

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key
3. Add them to your `.env.local` file
4. Set up the required database tables for babies and user management

### Tailwind CSS

The app uses NativeWind for styling. Configuration is in `tailwind.config.js`. You can customize the theme and add new utility classes as needed.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors
Nicolás Ruiz

- **Nicolás Ruiz** - *Initial work* - [YourGitHub](https://github.com/IamNewInThis)

## 🙏 Acknowledgments

- Thanks to the Expo team for the amazing development experience
- Supabase for providing an excellent backend solution
- The React Native community for continuous support
