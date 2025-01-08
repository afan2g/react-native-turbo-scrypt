import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  Button,
} from 'react-native';

import {scrypt} from './specs/NativeScrypt';
const EMPTY = '<empty>';
const N = 1 << 17;
const r = 8;
const p = 1;
const dkLen = 32;

function generateRandomBytes(length: number): Uint8Array {
  return new Uint8Array(Array.from({ length }, () => Math.floor(Math.random() * 256)));
}

function App(): React.JSX.Element {
  const [value, setValue] = React.useState<string>(EMPTY);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState<number>(0);
  const [iteration, setIteration] = React.useState<number>(0);

  const computeHash = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);
    try {
      console.log('Starting hash computation');
      
      // Generate random password and salt
      const randomPassword = generateRandomBytes(32); // 32 bytes random password
      const randomSalt = generateRandomBytes(16); // 16 bytes random salt
      
      // Convert to base64
      const passwordStr = btoa(String.fromCharCode.apply(null, Array.from(randomPassword)));
      const saltStr = btoa(String.fromCharCode.apply(null, Array.from(randomSalt)));
      
      console.log('Using random inputs:', {
        passwordLength: randomPassword.length,
        saltLength: randomSalt.length
      });

      const hash = await scrypt(
        passwordStr,
        saltStr,
        N,
        r,
        p,
        dkLen,
        (p) => {
          console.log('Progress:', p);
          setProgress(p);
        }
      );
      
      console.log('Hash computed:', hash);
      setValue(hash);
      setIteration(prev => prev + 1);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error('Error computing hash:', errorMessage);
      setError(errorMessage);
      setValue(EMPTY);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    computeHash();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>
        Scrypt hashing details: N={N}, r={r}, p={p}, dkLen={dkLen}
      </Text>
      <Text style={styles.text}>
        Hash #{iteration}:
      </Text>
      <Text style={styles.hash}>
        {value}
      </Text>
      {loading && (
        <Text style={styles.text}>
          Computing... {progress.toFixed(0)}%
        </Text>
      )}
      {error && (
        <Text style={[styles.text, styles.error]}>
          Error: {error}
        </Text>
      )}
      <Button 
        title="Generate New Random Hash" 
        onPress={computeHash}
        disabled={loading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  text: {
    margin: 10,
    fontSize: 20,
  },
  hash: {
    margin: 10,
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#2196F3',
  },
  error: {
    color: 'red',
  }
});

export default App;