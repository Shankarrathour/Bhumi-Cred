import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform, Dimensions, Alert, Share, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useAuthStore } from '../../src/store/authStore';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
 

const { width } = Dimensions.get('window');

export default function InsuranceCertificateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const authUser = useAuthStore((state) => state.user);

  // Parameters
  const policyName = params.policyName as string || 'Eco Life Protection';
  const treeName = params.treeName as string || '10 Group Cluster';
  const species = params.species as string || 'Teakwood/Mango';
  const count = params.count as string || '10';
  const cover = params.cover as string || '16000';
  const premium = params.premium as string || '699';

  const [downloading, setDownloading] = useState(false);
  const policyId = `BS-${Math.floor(200000 + Math.random() * 800000)}`;

  const getCertificateHtml = () => {
    const farmerName = authUser?.fullName || 'Farmer';
    const farmerIdText = authUser?.mobile ? `(ID: BC-${authUser.mobile.slice(-4)})` : '';
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=800" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; background: #fff; margin: 0; box-sizing: border-box; }
            .border-frame { border: 8px solid #00FF87; border-radius: 24px; padding: 12px; height: 1050px; box-sizing: border-box; }
            .inner-frame { border: 2px solid #00D084; border-radius: 12px; padding: 40px 30px; text-align: center; background: #FAFDFB; height: 100%; box-sizing: border-box; }
            .header h1 { color: #00D084; font-size: 24px; letter-spacing: 2px; margin-bottom: 5px; }
            .header p { color: #64748b; font-size: 14px; font-weight: bold; margin-top: 0; }
            .divider { height: 2px; background: #CBD5E1; width: 80%; margin: 30px auto; }
            .title { font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: 1px; margin-bottom: 10px; }
            .subtitle { font-size: 14px; color: #64748b; line-height: 1.6; padding: 0 40px; margin-bottom: 40px; }
            .details { width: 100%; border: 1px solid #E2E8F0; border-radius: 12px; padding: 25px; background: #fff; margin: 0 auto 40px auto; text-align: left; box-sizing: border-box;}
            .row { display: flex; justify-content: space-between; margin-bottom: 15px; }
            .row:last-child { margin-bottom: 0; }
            .label { font-size: 14px; color: #64748b; font-weight: bold; }
            .value { font-size: 14px; color: #0f172a; font-weight: 800; }
            .highlight { color: #00D084; font-weight: 900; font-size: 16px; }
            .footer { display: flex; justify-content: space-between; align-items: center; padding: 0 20px; margin-bottom: 40px; }
            .qr-box { text-align: center; }
            .qr-box img { width: 80px; height: 80px; margin-bottom: 5px; }
            .qr-box p { font-size: 12px; font-weight: bold; color: #00D084; margin: 0; }
            .seal-box { text-align: center; }
            .seal-box .seal { width: 80px; height: 80px; background: linear-gradient(135deg, #F59E0B, #D97706); border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white; font-size: 36px; margin: 0 auto 5px auto; font-weight: bold; }
            .seal-box p { font-size: 14px; font-weight: 900; color: #D97706; margin: 0; }
            .dates { font-size: 14px; color: #64748b; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="border-frame">
            <div class="inner-frame">
              <div class="header">
                <h1>BHUMICRED SATELLITE REGISTRY</h1>
                <p>Canopy Protection & Climate Shield</p>
              </div>
              <div class="divider"></div>
              <div class="title">CERTIFICATE OF ECO-SHIELD PROTECTION</div>
              <div class="subtitle">This document certifies that the agricultural tree asset registered below is officially covered against climate hazards under the BhumiShield program.</div>
              
              <div class="details">
                <div class="row"><span class="label">Certificate ID:</span><span class="value">${policyId}</span></div>
                <div class="row"><span class="label">Insured Farmer:</span><span class="value">${farmerName} ${farmerIdText}</span></div>
                <div class="row"><span class="label">Plantation Unit:</span><span class="value">${treeName} (${count} Saplings)</span></div>
                <div class="row"><span class="label">Cover Details:</span><span class="value">${policyName}</span></div>
                <div class="row"><span class="label">Total Coverage Limit:</span><span class="value highlight">₹${cover}</span></div>
                <div class="row"><span class="label">Annual Premium Paid:</span><span class="value">₹${premium}</span></div>
              </div>

              <div class="footer">
                <div class="qr-box">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BHUMICRED-${policyId}" />
                  <p>GEO SYNCED</p>
                </div>
                <div class="seal-box">
                  <div class="seal">&#10003;</div>
                  <p>APPROVED</p>
                </div>
              </div>

              <div class="dates">
                Issued: 29th May 2026 &nbsp;&nbsp;&bull;&nbsp;&nbsp; Expires: 28th May 2027
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const generateAndSavePdf = async () => {
    const htmlContent = getCertificateHtml();
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    
    // Copy/move it using modern File system API to rename it
    const srcFile = new File(uri);
    const destFile = new File(Paths.document, `Certificate_${policyId}.pdf`);
    srcFile.move(destFile);
    
    return destFile.uri;
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const pdfUri = await generateAndSavePdf();
      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Download Digital Certificate',
        UTI: 'com.adobe.pdf',
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to download certificate.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    setDownloading(true);
    try {
      const pdfUri = await generateAndSavePdf();
      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Digital Certificate',
        UTI: 'com.adobe.pdf',
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to share certificate.');
    } finally {
      setDownloading(false);
    }
    try {
      await Share.share({
        message: `Proud to secure my agricultural assets! My tree plantation cluster has been officially certified under BhumiCred Tree Shield. Policy: ${policyName} (Cover: ₹${cover}).`,
      });
    } catch (e) {
      // Ignore
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4FDF9" />
      {/* Header */}
      <View style={[styles.navBar, { paddingTop: insets.top > 0 ? insets.top + 10 : (Platform.OS === 'ios' ? 50 : 30) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/insurance' as any)}>
          <MaterialCommunityIcons name="close" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Digital Certificate</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollArea} showsVerticalScrollIndicator={false}>

        {/* Single Source of Truth WebView Certificate */}
        <View style={{ width: '100%', height: width * 1.5, borderRadius: 24, overflow: 'hidden', backgroundColor: '#fff', ...(SHADOWS.glow as any) }}>
          <WebView 
            originWhitelist={['*']}
            source={{ html: getCertificateHtml() }} 
            style={{ flex: 1, backgroundColor: 'transparent' }}
            scalesPageToFit={Platform.OS === 'android'}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>

        {/* Action button triggers */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleDownloadPdf}
            disabled={downloading}
          >
            <View style={styles.actionInner}>
              {downloading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <MaterialCommunityIcons name="download" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.actionBtnLabel}>Download PDF</Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.primaryBtn]}
            onPress={handleShare}
          >
            <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.primaryGrad}>
              <MaterialCommunityIcons name="share-variant" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={[styles.actionBtnLabel, { color: '#FFFFFF' }]}>Share Eco Shield</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => router.replace('/insurance' as any)}
        >
          <Text style={styles.doneBtnText}>Return to Insurance Ledger</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FDF9',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
    borderRadius: 10,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  scrollArea: {
    padding: 20,
  },
  certificateBorder: {
    backgroundColor: '#FFFFFF',
    borderWidth: 8,
    borderColor: COLORS.primary,
    borderRadius: 24,
    padding: 10,
    ...(SHADOWS.glow as any),
  },
  certificateInnerCard: {
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FAFDFB',
  },
  certHeader: {
    alignItems: 'center',
    marginTop: 10,
  },
  certBrandName: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginTop: 8,
  },
  certTagline: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  solidDivider: {
    height: 1.5,
    backgroundColor: '#CBD5E1',
    width: '80%',
    marginVertical: 14,
  },
  declarationText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primaryDark,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  declarationSub: {
    fontSize: 9,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 13,
    fontWeight: '600',
    marginTop: 6,
    paddingHorizontal: 10,
  },
  detailsBlock: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  detailValue: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  sealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 20,
    alignItems: 'center',
  },
  qrStamp: {
    alignItems: 'center',
  },
  qrLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 4,
  },
  goldSeal: {
    alignItems: 'center',
  },
  goldCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...(SHADOWS.soft as any),
  },
  sealLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#D97706',
    marginTop: 4,
  },
  validityRow: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 6,
  },
  validityText: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginHorizontal: 4,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionBtn: {
    width: '48%',
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...(SHADOWS.soft as any),
  },
  actionInner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  actionBtnLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  primaryBtn: {
    borderWidth: 0,
    ...(SHADOWS.glow as any),
  },
  primaryGrad: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  doneBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 16,
  },
  doneBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
});
