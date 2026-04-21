import 'react-native-gesture-handler';
import { bootstrapStores } from './src/stores/bootstrap';
// Install user-scoped AsyncStorage backends on every persisted zustand store.
// Must run before App mounts so the persist middleware has storage refs ready
// when onAuthStateChanged triggers rehydration.
bootstrapStores();
import { registerRootComponent } from 'expo';
import App from './src/App';

registerRootComponent(App);
