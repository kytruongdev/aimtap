// Pilot AUT declaration (US-5.2): Sauce Labs My Demo App for iOS (bundle id
// com.saucelabs.mydemo.app.ios), run on a simulator. Validated at load time by the App Registry
// schema (App Registry, TICKET-005). The build is a per-machine binary under build/ (git-ignored);
// deviceId and osVersion are the QC machine's simulator — adjust to a booted simulator with iOS >= 16.6.
export default {
  appId: 'my-demo-app',
  buildPath: 'apps/my-demo-app/build/Payload/My Demo App.app',
  deviceType: 'simulator',
  deviceId: 'iPhone 17',
  osVersion: '26.5',
};
