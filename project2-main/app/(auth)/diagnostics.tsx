import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { modernStyles } from '@/constants/modernStyles';

interface DiagnosticResult {
  name: string;
  status: 'checking' | 'success' | 'failed';
  message: string;
  time?: number;
}

export default function DiagnosticsScreen() {
  const [results, setResults] = useState<DiagnosticResult[]>([
    { name: 'Browser Online Status', status: 'checking', message: 'Checking...' },
    { name: 'Test: example.com (Basic Internet)', status: 'checking', message: 'Checking...' },
    { name: 'Test: google.com (DNS Resolution)', status: 'checking', message: 'Checking...' },
    { name: 'Test: Supabase Server', status: 'checking', message: 'Checking...' },
  ]);

  useEffect(() => {
    const runDiagnostics = async () => {
      const tests = [...results];

      // Test 1: Browser online status
      tests[0] = {
        name: 'Browser Online Status',
        status: navigator.onLine ? 'success' : 'failed',
        message: navigator.onLine
          ? '✅ Browser reports online'
          : '❌ Browser reports OFFLINE - Check your internet!',
      };
      setResults([...tests]);

      // Test 2: Basic Internet (example.com - very stable)
      try {
        const start = Date.now();
        const response = await fetch('https://example.com/', {
          method: 'HEAD',
          signal: AbortSignal.timeout(10000),
        });
        const time = Date.now() - start;
        tests[1] = {
          name: 'Test: example.com (Basic Internet)',
          status: 'success',
          message: `✅ Internet works! (${time}ms, Status: ${response.status})`,
          time,
        };
      } catch (e) {
        const errorMsg = (e as any).message;
        tests[1] = {
          name: 'Test: example.com (Basic Internet)',
          status: 'failed',
          message: `❌ Cannot reach ANY external site: ${errorMsg}`,
        };
      }
      setResults([...tests]);

      // Test 3: Google.com (DNS test)
      try {
        const start = Date.now();
        const response = await fetch('https://www.google.com/', {
          method: 'HEAD',
          signal: AbortSignal.timeout(10000),
        });
        const time = Date.now() - start;
        tests[2] = {
          name: 'Test: google.com (DNS Resolution)',
          status: 'success',
          message: `✅ DNS works! Google reachable (${time}ms)`,
          time,
        };
      } catch (e) {
        const errorMsg = (e as any).message;
        tests[2] = {
          name: 'Test: google.com (DNS Resolution)',
          status: 'failed',
          message: `⚠️ Cannot reach Google: ${errorMsg}`,
        };
      }
      setResults([...tests]);

      // Test 4: Supabase
      try {
        const start = Date.now();
        const response = await fetch('https://jfjeckgmzjsfylwlqjdi.supabase.co', {
          method: 'HEAD',
          signal: AbortSignal.timeout(10000),
        });
        const time = Date.now() - start;
        tests[3] = {
          name: 'Test: Supabase Server',
          status: 'success',
          message: `✅ Supabase reachable! (${time}ms, Status: ${response.status})`,
          time,
        };
      } catch (e) {
        const errorMsg = (e as any).message;
        tests[3] = {
          name: 'Test: Supabase Server',
          status: 'failed',
          message: `❌ Cannot reach Supabase: ${errorMsg}`,
        };
      }
      setResults([...tests]);
    };

    runDiagnostics();
  }, []);

  const analyzeResults = () => {
    const browserOnline = results[0].status === 'success';
    const basicInternetWorks = results[1].status === 'success';
    const googleWorks = results[2].status === 'success';
    const supabaseWorks = results[3].status === 'success';

    let analysis = '';
    let solutions: string[] = [];

    if (!browserOnline) {
      analysis = '🔴 OFFLINE: Browser is offline';
      solutions.push('❌ Your browser says you are OFFLINE');
      solutions.push('1. Check if WiFi/Network is connected');
      solutions.push('2. Try reconnecting to WiFi');
      solutions.push('3. Restart your router (unplug for 10 seconds)');
      solutions.push('4. Check if other devices can access internet');
    } else if (!basicInternetWorks) {
      analysis = '🔴 NETWORK BLOCKED: Cannot reach ANY external servers';
      solutions.push('❌ Your network is completely isolated');
      solutions.push('POSSIBLE CAUSES:');
      solutions.push('• Firewall blocking ALL external connections');
      solutions.push('• ISP blocking outbound traffic');
      solutions.push('• Corporate/School network restrictions');
      solutions.push('');
      solutions.push('SOLUTIONS TO TRY:');
      solutions.push('1. If on WiFi: Try using mobile hotspot instead');
      solutions.push('2. If on corporate network: Ask IT for internet access');
      solutions.push('3. Try using a VPN (NordVPN, ExpressVPN, ProtonVPN)');
      solutions.push('4. Restart your computer and Router');
      solutions.push('5. Contact your ISP if no improvement');
    } else if (!googleWorks && basicInternetWorks) {
      analysis = '⚠️ SELECTIVE BLOCKING: Some sites work, others don\'t';
      solutions.push('⚠️ Your network is selectively blocking sites');
      solutions.push('POSSIBLE CAUSES:');
      solutions.push('• ISP/Network firewall blocking specific domains');
      solutions.push('• DNS filtering or blocking policy');
      solutions.push('');
      solutions.push('SOLUTIONS TO TRY:');
      solutions.push('1. Try using a VPN - this will bypass the blocking');
      solutions.push('2. Change your DNS to Cloudflare (1.1.1.1 or 1.0.0.1)');
      solutions.push('3. Ask your network administrator for access');
    } else if (!supabaseWorks && basicInternetWorks) {
      analysis = '⚠️ SUPABASE BLOCKED: General internet works, but Supabase doesn\'t';
      solutions.push('⚠️ Supabase is being blocked on your network');
      solutions.push('POSSIBLE CAUSES:');
      solutions.push('• Your network specifically blocks Supabase');
      solutions.push('• ISP/Firewall policy against this domain');
      solutions.push('');
      solutions.push('SOLUTIONS TO TRY:');
      solutions.push('1. ✅ USE A VPN (Most effective fix)');
      solutions.push('   - Download: NordVPN, ExpressVPN, or ProtonVPN');
      solutions.push('   - Connect to any server');
      solutions.push('   - Try signing up again');
      solutions.push('');
      solutions.push('2. Change DNS to Cloudflare:');
      solutions.push('   - Windows: Settings → Network → DNS');
      solutions.push('   - Set to 1.1.1.1 and 1.0.0.1');
      solutions.push('');
      solutions.push('3. Ask network admin for access to Supabase');
    } else {
      analysis = '✅ ALL SYSTEMS OK: Everything is working!';
      solutions.push('✅ Your internet connection is working perfectly');
      solutions.push('✅ You can reach all required services');
      solutions.push('');
      solutions.push('NEXT STEPS:');
      solutions.push('1. Go back to Sign Up');
      solutions.push('2. Try signing up again');
      solutions.push('3. If signup still fails, check the console for detailed errors');
    }

    return { analysis, solutions };
  };

  const { analysis, solutions } = analyzeResults();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 Network Diagnostics</Text>

      <View style={styles.resultsContainer}>
        {results.map((result, idx) => (
          <View key={idx} style={styles.resultItem}>
            <Text
              style={[
                styles.resultName,
                {
                  color:
                    result.status === 'success'
                      ? '#10b981'
                      : result.status === 'failed'
                        ? '#ef4444'
                        : '#f59e0b',
                },
              ]}
            >
              {result.name}
            </Text>
            <Text style={styles.resultMessage}>{result.message}</Text>
          </View>
        ))}
      </View>

      <View style={styles.analysisContainer}>
        <Text style={styles.analysisTitle}>{analysis}</Text>

        <View style={styles.solutionsContainer}>
          <Text style={styles.solutionsTitle}>📋 Solutions:</Text>
          {solutions.map((solution, idx) => (
            <Text key={idx} style={styles.solutionItem}>
              {solution}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.linksContainer}>
        <Text style={styles.linksTitle}>📚 Recommended Tools & Resources:</Text>
        <Pressable
          onPress={() => {
            window.open('https://www.nordvpn.com/', '_blank');
          }}
        >
          <Text style={styles.link}>💻 NordVPN (Most recommended)</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            window.open('https://www.expressvpn.com/', '_blank');
          }}
        >
          <Text style={styles.link}>💻 ExpressVPN</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            window.open('https://protonvpn.com/', '_blank');
          }}
        >
          <Text style={styles.link}>💻 ProtonVPN (Free option)</Text>
        </Pressable>
        
        <Text style={[styles.linksTitle, { marginTop: 16 }]}>📡 Change DNS (Alternative to VPN):</Text>
        <Pressable
          onPress={() => {
            window.open('https://1.1.1.1/dns/', '_blank');
          }}
        >
          <Text style={styles.link}>🔗 Cloudflare DNS Setup Guide</Text>
        </Pressable>
        
        <Text style={[styles.linksTitle, { marginTop: 16 }]}>📊 Status & Support:</Text>
        <Pressable
          onPress={() => {
            window.open('https://status.supabase.com', '_blank');
          }}
        >
          <Text style={styles.link}>🟢 Supabase Status Page</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.retryButton}
        onPress={() => {
          window.location.reload();
        }}
      >
        <Text style={styles.retryButtonText}>🔄 Retry Tests</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#1e293b',
  },
  resultsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resultItem: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  resultName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultMessage: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  analysisContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  solutionsContainer: {
    marginTop: 12,
  },
  solutionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  solutionItem: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6,
    lineHeight: 18,
  },
  linksContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  linksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  link: {
    fontSize: 13,
    color: '#3b82f6',
    marginBottom: 8,
    textDecorationLine: 'underline',
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
