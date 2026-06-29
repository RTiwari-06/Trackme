import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function WatchersScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="subtitle">Watchers & Journeys</ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">
            View current watchers and recent journeys. Manage sharing links and inspect live data.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.sectionsWrapper}>
          <Collapsible title="Active Watchers">
            <ThemedText type="small">People you've shared journeys with recently.</ThemedText>
            <ThemedView type="backgroundElement" style={styles.listItem}>
              <ThemedText type="smallBold">Mom</ThemedText>
              <ThemedText type="small">+91 98765 43210 (WhatsApp)</ThemedText>
            </ThemedView>
            <ThemedView type="backgroundElement" style={styles.listItem}>
              <ThemedText type="smallBold">Dad</ThemedText>
              <ThemedText type="small">+91 98765 43211 (SMS)</ThemedText>
            </ThemedView>
          </Collapsible>

          <Collapsible title="Recent Journeys">
            <ThemedText type="small">Last journeys recorded on this device.</ThemedText>
            <ThemedView type="backgroundElement" style={styles.listItem}>
              <ThemedText type="smallBold">Connaught Place → DU</ThemedText>
              <ThemedText type="small">Duration: 25m • Distance: 6.2 km</ThemedText>
            </ThemedView>
            <ThemedView type="backgroundElement" style={styles.listItem}>
              <ThemedText type="smallBold">Home → College</ThemedText>
              <ThemedText type="small">Duration: 27m • Distance: 6.8 km</ThemedText>
            </ThemedView>
          </Collapsible>

          <Collapsible title="Live Watcher Link">
            <ThemedText type="small">Create or revoke temporary sharing links for watchers.</ThemedText>
          </Collapsible>
        </ThemedView>
        {Platform.OS === 'web' && <WebBadge />}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { flexDirection: 'row', justifyContent: 'center' },
  container: { maxWidth: MaxContentWidth, flexGrow: 1 },
  titleContainer: { gap: Spacing.three, alignItems: 'center', paddingHorizontal: Spacing.four, paddingVertical: Spacing.six },
  centerText: { textAlign: 'center' },
  sectionsWrapper: { gap: Spacing.five, paddingHorizontal: Spacing.four, paddingTop: Spacing.three },
  listItem: { padding: Spacing.three, marginTop: Spacing.two, borderRadius: Spacing.two }
});
