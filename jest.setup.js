const mockAsyncStorage = require('@react-native-async-storage/async-storage/jest/async-storage-mock');

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('react-native-safe-area-context', () => {
  const React = jest.requireActual('react');

  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 0, height: 0 };

  const SafeAreaInsetsContext = React.createContext(insets);
  const SafeAreaFrameContext = React.createContext(frame);

  const SafeAreaProvider = ({ children, initialMetrics }) => {
    const metricsInsets = initialMetrics?.insets ?? insets;
    const metricsFrame = initialMetrics?.frame ?? frame;

    return React.createElement(
      SafeAreaFrameContext.Provider,
      { value: metricsFrame },
      React.createElement(
        SafeAreaInsetsContext.Provider,
        { value: metricsInsets },
        children,
      ),
    );
  };
  SafeAreaProvider.displayName = 'SafeAreaProvider';

  const SafeAreaView = React.forwardRef(({ children, ...props }, ref) =>
    React.createElement('View', { ...props, ref }, children),
  );
  SafeAreaView.displayName = 'SafeAreaView';

  return {
    __esModule: true,
    SafeAreaProvider,
    SafeAreaView,
    SafeAreaInsetsContext,
    SafeAreaFrameContext,
    useSafeAreaInsets: () => React.useContext(SafeAreaInsetsContext),
    useSafeAreaFrame: () => React.useContext(SafeAreaFrameContext),
    initialWindowMetrics: { frame, insets },
    NativeSafeAreaProvider: SafeAreaProvider,
    SafeAreaProviderCompat: SafeAreaProvider,
    default: SafeAreaProvider,
  };
});

jest.mock('react-native/Libraries/Modal/Modal', () => {
  const React = jest.requireActual('react');
  const Modal = ({ visible = true, children, ...props }) => {
    if (!visible) {
      return null;
    }
    return React.createElement('View', props, children);
  };
  Modal.displayName = 'Modal';
  return Modal;
});

jest.mock(
  'react-native-css-interop/src/runtime/third-party-libs/react-native-safe-area-context',
  () => ({
    maybeHijackSafeAreaProvider: (type) => type,
  }),
);

jest.mock(
  'react-native-css-interop/src/runtime/third-party-libs/react-native-safe-area-context.native',
  () => ({
    maybeHijackSafeAreaProvider: (type) => type,
  }),
);

jest.mock(
  'react-native-css-interop/src/runtime/third-party-libs/react-native-safe-area-context.native.tsx',
  () => ({
    maybeHijackSafeAreaProvider: (type) => type,
  }),
);

try {
  const safeAreaInterop = require('react-native-css-interop/src/runtime/third-party-libs/react-native-safe-area-context.native');
  if (safeAreaInterop && typeof safeAreaInterop.maybeHijackSafeAreaProvider === 'function') {
    safeAreaInterop.maybeHijackSafeAreaProvider = (type) => type;
  }
} catch (error) {
  // ignore if module resolution fails in test environment
}
