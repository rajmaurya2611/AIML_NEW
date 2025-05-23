// src/RKIPApp.tsx
import React from 'react';
import { Provider } from 'react-redux';
import store from './store_RKIP/store';
import KIPMain from './KIP_Main';

const RKIPApp: React.FC = () => (
  <Provider store={store}>
    <KIPMain />
  </Provider>
);

export default RKIPApp;
