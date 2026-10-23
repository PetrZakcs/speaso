import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Share,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStore } from '../../state/store';
import { useTranslation } from '../../i18n/useTranslation';
import Card, { PressableCard } from '../../components/Card';
import {
  checkSupabaseHealth,
  sendTestOnboardingRow,
  sendTestResearchRecord,
  sendTestAnalyticsEvent,
  syncTestNotificationSchedule,
  getStoredAdminSession,
  adminLogin,
  adminLogout,
  fetchAdminSummary,
  fetchOnboardingAnswers,
  fetchResearchRecords,
  fetchAnalyticsEvents,
  fetchNotificationSchedules,
  fetchVipPromoCodes,
  fetchTherapistPatients,
  exportOnboardingCsv,
  exportResearchCsv,
  exportAnalyticsCsv,
  exportSchedulesCsv,
  exportVipCsv,
  exportTherapistPatientsCsv,
  SUPABASE_STUDIO_URL,
  RLS_ENABLE_SQL,
  type SupabaseHealth,
  type AdminSession,
  type AdminTableSummary,
  type OnboardingAnswerRow,
  type ResearchBalbutiesRow,
  type AnalyticsEventRow,
  type NotificationScheduleRow,
  type VipPromoCodeRow,
  type TherapistPatientRow,
} from '../../lib/admin';
import { hapticPress, hapticSuccess } from '../../lib/haptics';
import { Colors, FontFamily, FontSize, Radius, Shadow } from '../../theme/tokens';

type AdminTab = 'overview' | 'onboarding' | 'research' | 'analytics' | 'schedules' | 'vip' | 'therapists';

export default function AdminScreen() {
  const { t } = useTranslation();
  const { installId } = useStore();

  // Auth gatekeeper state
  const [session, setSession] = useState<AdminSession>({ isAuthenticated: false, email: null });
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Health check & stats
  const [health, setHealth] = useState<SupabaseHealth | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDevTools, setShowDevTools] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedRls, setCopiedRls] = useState(false);

  // Live Data States
  const [summary, setSummary] = useState<AdminTableSummary>({
    onboardingCount: 0,
    researchCount: 0,
    analyticsCount: 0,
    schedulesCount: 0,
    vipCodesCount: 0,
    therapistsCount: 0,
  });
  const [loadingData, setLoadingData] = useState(false);
  const [onboardingRows, setOnboardingRows] = useState<OnboardingAnswerRow[]>([]);
  const [researchRows, setResearchRows] = useState<ResearchBalbutiesRow[]>([]);
  const [analyticsRows, setAnalyticsRows] = useState<AnalyticsEventRow[]>([]);
  const [schedulesRows, setSchedulesRows] = useState<NotificationScheduleRow[]>([]);
  const [vipRows, setVipRows] = useState<VipPromoCodeRow[]>([]);
  const [therapistsRows, setTherapistsRows] = useState<TherapistPatientRow[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // Test dispatch states
  const [testingAnswers, setTestingAnswers] = useState(false);
  const [answersResult, setAnswersResult] = useState<string | null>(null);
  const [testingResearch, setTestingResearch] = useState(false);
  const [researchResult, setResearchResult] = useState<string | null>(null);
  const [testingEvent, setTestingEvent] = useState(false);
  const [eventResult, setEventResult] = useState<string | null>(null);
  const [testingSchedule, setTestingSchedule] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<string | null>(null);

  // 1. Check existing admin session on mount
  useEffect(() => {
    let cancelled = false;
    getStoredAdminSession().then((stored) => {
      if (!cancelled) {
        setSession(stored);
        setCheckingAuth(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Load all live data from Supabase
  const loadAllData = useCallback(async () => {
    if (!session.isAuthenticated) return;
    setLoadingData(true);
    try {
      const [sum, hRes, onb, resData, evData, schData, vipData, therData] = await Promise.all([
        fetchAdminSummary(session.token),
        checkSupabaseHealth(),
        fetchOnboardingAnswers(session.token, 50),
        fetchResearchRecords(session.token, 50),
        fetchAnalyticsEvents(session.token, 50),
        fetchNotificationSchedules(session.token, 50),
        fetchVipPromoCodes(session.token, 50),
        fetchTherapistPatients(session.token, 50),
      ]);

      setSummary(sum);
      setHealth(hRes);
      setOnboardingRows(onb.data);
      setResearchRows(resData.data);
      setAnalyticsRows(evData.data);
      setSchedulesRows(schData.data);
      setVipRows(vipData.data);
      setTherapistsRows(therData.data);
    } catch (err) {
      console.warn('[admin] loadAllData error:', err);
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  }, [session.isAuthenticated, session.token]);

  useEffect(() => {
    if (!session.isAuthenticated) return;
    let cancelled = false;

    Promise.all([
      fetchAdminSummary(session.token),
      checkSupabaseHealth(),
      fetchOnboardingAnswers(session.token, 50),
      fetchResearchRecords(session.token, 50),
      fetchAnalyticsEvents(session.token, 50),
      fetchNotificationSchedules(session.token, 50),
      fetchVipPromoCodes(session.token, 50),
      fetchTherapistPatients(session.token, 50),
    ])
      .then(([sum, hRes, onb, resData, evData, schData, vipData, therData]) => {
        if (!cancelled) {
          setSummary(sum);
          setHealth(hRes);
          setOnboardingRows(onb.data);
          setResearchRows(resData.data);
          setAnalyticsRows(evData.data);
          setSchedulesRows(schData.data);
          setVipRows(vipData.data);
          setTherapistsRows(therData.data);
          setLoadingData(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('[admin] initial load error:', err);
          setLoadingData(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session.isAuthenticated, session.token]);

  const onRefresh = async () => {
    setRefreshing(true);
    hapticPress();
    await loadAllData();
  };

  const handleLogin = async () => {
    hapticPress();
    setLoginError(null);
    setLoginLoading(true);

    const res = await adminLogin(loginEmail, loginPassword);
    setLoginLoading(false);

    if (res.ok && res.session) {
      hapticSuccess();
      setSession(res.session);
    } else {
      setLoginError(res.error || t('admin.login_error_invalid'));
    }
  };

  const handleLogout = async () => {
    hapticPress();
    await adminLogout();
    setSession({ isAuthenticated: false, email: null });
    setLoginPassword('');
  };

  const copyInstallId = async () => {
    hapticSuccess();
    try {
      await Share.share({ message: installId });
    } catch {
      // fallback
    }
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  const copyRlsSql = async () => {
    hapticSuccess();
    try {
      await Share.share({
        title: 'Speaso Supabase RLS Read Policies',
        message: RLS_ENABLE_SQL,
      });
    } catch {
      // fallback
    }
    setCopiedRls(true);
    setTimeout(() => setCopiedRls(false), 3000);
  };

  // Test dispatchers
  const handleTestAnswers = async () => {
    hapticPress();
    setTestingAnswers(true);
    setAnswersResult(null);
    const res = await sendTestOnboardingRow();
    setTestingAnswers(false);
    if (res.ok) {
      hapticSuccess();
      setAnswersResult(t('admin.test_success'));
      loadAllData();
    } else {
      setAnswersResult(t('admin.test_error', { err: res.error || `HTTP ${res.status}` }));
    }
  };

  const handleTestResearch = async () => {
    hapticPress();
    setTestingResearch(true);
    setResearchResult(null);
    const res = await sendTestResearchRecord();
    setTestingResearch(false);
    if (res.ok) {
      hapticSuccess();
      setResearchResult(t('admin.test_success'));
      loadAllData();
    } else {
      setResearchResult(t('admin.test_error', { err: res.error || `HTTP ${res.status}` }));
    }
  };

  const handleTestEvent = async () => {
    hapticPress();
    setTestingEvent(true);
    setEventResult(null);
    const res = await sendTestAnalyticsEvent();
    setTestingEvent(false);
    if (res.ok) {
      hapticSuccess();
      setEventResult(t('admin.test_success'));
      loadAllData();
    } else {
      setEventResult(t('admin.test_error', { err: res.error || `HTTP ${res.status}` }));
    }
  };

  const handleTestSchedule = async () => {
    hapticPress();
    setTestingSchedule(true);
    setScheduleResult(null);
    const res = await syncTestNotificationSchedule();
    setTestingSchedule(false);
    if (res.ok) {
      hapticSuccess();
      setScheduleResult(t('admin.test_success'));
      loadAllData();
    } else {
      setScheduleResult(t('admin.test_error', { err: 'Chyba synchronizace' }));
    }
  };

  // Filtered rows memoization
  const filteredOnboarding = useMemo(() => {
    if (!searchQuery.trim()) return onboardingRows;
    const q = searchQuery.toLowerCase();
    return onboardingRows.filter(
      (r) =>
        r.install_id.toLowerCase().includes(q) ||
        r.goal?.toLowerCase().includes(q) ||
        r.age_group?.toLowerCase().includes(q) ||
        r.scenario_title?.toLowerCase().includes(q) ||
        (Array.isArray(r.situations) && r.situations.some((s) => s.toLowerCase().includes(q)))
    );
  }, [onboardingRows, searchQuery]);

  const filteredResearch = useMemo(() => {
    if (!searchQuery.trim()) return researchRows;
    const q = searchQuery.toLowerCase();
    return researchRows.filter(
      (r) =>
        r.install_id.toLowerCase().includes(q) ||
        r.date.includes(q) ||
        r.weather?.toLowerCase().includes(q) ||
        (Array.isArray(r.somatic_tags) && r.somatic_tags.some((s) => s.toLowerCase().includes(q)))
    );
  }, [researchRows, searchQuery]);

  const filteredAnalytics = useMemo(() => {
    if (!searchQuery.trim()) return analyticsRows;
    const q = searchQuery.toLowerCase();
    return analyticsRows.filter(
      (r) => r.event.toLowerCase().includes(q) || r.install_id.toLowerCase().includes(q)
    );
  }, [analyticsRows, searchQuery]);

  const filteredSchedules = useMemo(() => {
    if (!searchQuery.trim()) return schedulesRows;
    const q = searchQuery.toLowerCase();
    return schedulesRows.filter(
      (r) => r.install_id.toLowerCase().includes(q) || r.timezone.toLowerCase().includes(q)
    );
  }, [schedulesRows, searchQuery]);

  const filteredVip = useMemo(() => {
    if (!searchQuery.trim()) return vipRows;
    const q = searchQuery.toLowerCase();
    return vipRows.filter(
      (r) => r.code.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
    );
  }, [vipRows, searchQuery]);

  const filteredTherapists = useMemo(() => {
    if (!searchQuery.trim()) return therapistsRows;
    const q = searchQuery.toLowerCase();
    return therapistsRows.filter(
      (r) =>
        r.patient_code.toLowerCase().includes(q) ||
        r.therapist_name?.toLowerCase().includes(q) ||
        r.clinic_name?.toLowerCase().includes(q) ||
        r.patient_alias?.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        r.notes?.toLowerCase().includes(q)
    );
  }, [therapistsRows, searchQuery]);

  // Loading initial auth check
  if (checkingAuth) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={Colors.accent.main} />
      </SafeAreaView>
    );
  }

  // ==========================================================
  // UNVERIFIED: ADMIN LOGIN GATE
  // ==========================================================
  if (!session.isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeBtn}
            accessibilityLabel={t('common.close')}
            accessibilityRole="button"
            hitSlop={12}
          >
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>{t('admin.login_title')}</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.gateHero}>
              <View style={styles.lockBadge}>
                <Ionicons name="shield-checkmark" size={32} color={Colors.accent.main} />
              </View>
              <Text style={styles.gateTitle}>{t('admin.login_title')}</Text>
              <Text style={styles.gateSub}>{t('admin.login_sub')}</Text>
            </View>

            <Card style={styles.cardPad}>
              <Text style={styles.fieldLabel}>{t('admin.login_email_label')}</Text>
              <TextInput
                value={loginEmail}
                onChangeText={setLoginEmail}
                placeholder={t('admin.login_email_ph')}
                placeholderTextColor={Colors.text.tertiary}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                style={styles.input}
              />

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
                {t('admin.login_password_label')}
              </Text>
              <TextInput
                value={loginPassword}
                onChangeText={setLoginPassword}
                placeholder={t('admin.login_password_ph')}
                placeholderTextColor={Colors.text.tertiary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />

              {loginError && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={Colors.danger.panic} />
                  <Text style={styles.errorBoxText}>{loginError}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.loginBtn}
                onPress={handleLogin}
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginBtnText}>{t('admin.login_submit')}</Text>
                )}
              </TouchableOpacity>
            </Card>

            <Card style={styles.whereCard}>
              <View style={styles.whereHeader}>
                <Ionicons name="key-outline" size={20} color={Colors.accent.main} />
                <Text style={styles.whereTitle}>Správa administrátorských účtů</Text>
              </View>
              <Text style={styles.whereDesc}>{t('admin.supabase_users_hint')}</Text>

              <TouchableOpacity
                style={styles.openStudioBtn}
                onPress={() =>
                  Linking.openURL(
                    'https://supabase.com/dashboard/project/phmhpdwhyvvrsjrobyyp/auth/users'
                  )
                }
              >
                <Ionicons name="people-outline" size={18} color="#FFFFFF" />
                <Text style={styles.openStudioBtnText}>Supabase Auth → Přidat uživatele ↗</Text>
              </TouchableOpacity>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // AUTHENTICATED: LIVE DATA & TELEMETRY DASHBOARD
  // ==========================================================
  const renderTabButton = (tab: AdminTab, labelKey: string, icon: any, count?: number) => {
    const isSelected = activeTab === tab;
    return (
      <TouchableOpacity
        key={tab}
        style={[styles.tabChip, isSelected && styles.tabChipActive]}
        onPress={() => {
          hapticPress();
          setActiveTab(tab);
          setSearchQuery('');
        }}
      >
        <Ionicons
          name={icon}
          size={14}
          color={isSelected ? '#FFFFFF' : Colors.text.secondary}
          style={{ marginRight: 4 }}
        />
        <Text style={[styles.tabChipText, isSelected && styles.tabChipTextActive]}>
          {t(labelKey)}
        </Text>
        {typeof count === 'number' && (
          <View style={[styles.tabBadge, isSelected && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, isSelected && styles.tabBadgeTextActive]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
          accessibilityLabel={t('common.close')}
          accessibilityRole="button"
          hitSlop={12}
        >
          <Ionicons name="close" size={24} color={Colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{t('admin.title')}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {t('admin.logged_in_as', { email: session.email || 'Admin' })}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshTopBtn}
          onPress={onRefresh}
          disabled={loadingData}
          hitSlop={8}
        >
          {loadingData ? (
            <ActivityIndicator size="small" color={Colors.accent.main} />
          ) : (
            <Ionicons name="refresh" size={20} color={Colors.accent.main} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Ionicons name="log-out-outline" size={16} color={Colors.danger.panic} />
          <Text style={styles.logoutBtnText}>{t('admin.logout_btn')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent.main}
          />
        }
      >
        {/* KPI Summary Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiScroll}
        >
          <TouchableOpacity
            style={[styles.kpiCard, activeTab === 'onboarding' && styles.kpiCardActive]}
            onPress={() => setActiveTab('onboarding')}
          >
            <Text style={styles.kpiLabel}>{t('admin.stat_onboarding')}</Text>
            <Text style={styles.kpiValue}>{summary.onboardingCount || onboardingRows.length}</Text>
            <Text style={styles.kpiHint}>dotazníky</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.kpiCard, activeTab === 'research' && styles.kpiCardActive]}
            onPress={() => setActiveTab('research')}
          >
            <Text style={styles.kpiLabel}>{t('admin.stat_research')}</Text>
            <Text style={styles.kpiValue}>{summary.researchCount || researchRows.length}</Text>
            <Text style={styles.kpiHint}>klinické check-iny</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.kpiCard, activeTab === 'analytics' && styles.kpiCardActive]}
            onPress={() => setActiveTab('analytics')}
          >
            <Text style={styles.kpiLabel}>{t('admin.stat_analytics')}</Text>
            <Text style={styles.kpiValue}>{summary.analyticsCount || analyticsRows.length}</Text>
            <Text style={styles.kpiHint}>události</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.kpiCard, activeTab === 'schedules' && styles.kpiCardActive]}
            onPress={() => setActiveTab('schedules')}
          >
            <Text style={styles.kpiLabel}>{t('admin.stat_schedules')}</Text>
            <Text style={styles.kpiValue}>{summary.schedulesCount || schedulesRows.length}</Text>
            <Text style={styles.kpiHint}>uživatelů</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.kpiCard, activeTab === 'vip' && styles.kpiCardActive]}
            onPress={() => setActiveTab('vip')}
          >
            <Text style={styles.kpiLabel}>{t('admin.stat_vip')}</Text>
            <Text style={styles.kpiValue}>{summary.vipCodesCount || vipRows.length}</Text>
            <Text style={styles.kpiHint}>kódy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.kpiCard, activeTab === 'therapists' && styles.kpiCardActive]}
            onPress={() => setActiveTab('therapists')}
          >
            <Text style={styles.kpiLabel}>{t('admin.stat_therapists')}</Text>
            <Text style={styles.kpiValue}>{summary.therapistsCount || therapistsRows.length}</Text>
            <Text style={styles.kpiHint}>propojení</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Tab Switcher */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
        >
          {renderTabButton('overview', 'admin.tab_overview', 'grid-outline')}
          {renderTabButton(
            'onboarding',
            'admin.tab_onboarding',
            'clipboard-outline',
            onboardingRows.length
          )}
          {renderTabButton(
            'research',
            'admin.tab_research',
            'flask-outline',
            researchRows.length
          )}
          {renderTabButton(
            'analytics',
            'admin.tab_analytics',
            'pulse-outline',
            analyticsRows.length
          )}
          {renderTabButton(
            'schedules',
            'admin.tab_schedules',
            'time-outline',
            schedulesRows.length
          )}
          {renderTabButton('vip', 'admin.tab_vip', 'gift-outline', vipRows.length)}
          {renderTabButton(
            'therapists',
            'admin.tab_therapists',
            'medkit-outline',
            therapistsRows.length
          )}
        </ScrollView>

        {/* Search bar for list tabs */}
        {activeTab !== 'overview' && (
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color={Colors.text.tertiary} style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('admin.filter_placeholder')}
              placeholderTextColor={Colors.text.tertiary}
              style={styles.searchInput}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={Colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ==========================================================
            TAB 1: OVERVIEW & SYSTEM HEALTH
        ========================================================== */}
        {activeTab === 'overview' && (
          <View>
            {/* Live Health Badge */}
            <Card style={styles.statusCard}>
              <View style={styles.statusRow}>
                <View style={styles.statusIndicatorRow}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: health?.ok ? Colors.accent.main : Colors.danger.panic },
                    ]}
                  />
                  <Text style={styles.statusTitle}>
                    {health?.ok ? t('admin.server_live') : t('admin.server_offline')}
                  </Text>
                </View>
                {health?.latencyMs !== undefined && (
                  <Text style={styles.latencyBadge}>{health.latencyMs} ms</Text>
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Supabase Endpoint:</Text>
                <Text style={styles.metaValue} numberOfLines={1}>
                  phmhpdwhyvvrsjrobyyp.supabase.co
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{t('admin.install_id')}:</Text>
                <TouchableOpacity onPress={copyInstallId} style={styles.copyRow}>
                  <Text style={styles.installIdText} numberOfLines={1}>
                    {installId}
                  </Text>
                  <Ionicons
                    name={copiedId ? 'checkmark-circle' : 'copy-outline'}
                    size={14}
                    color={Colors.accent.main}
                  />
                </TouchableOpacity>
              </View>
            </Card>

            {/* Quick Live Preview: Latest Notification Schedules */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Poslední aktivní rozvrhy notifikací</Text>
              <TouchableOpacity onPress={() => setActiveTab('schedules')}>
                <Text style={styles.seeAllText}>Vše ({schedulesRows.length}) →</Text>
              </TouchableOpacity>
            </View>

            {schedulesRows.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="time-outline" size={32} color={Colors.text.tertiary} />
                <Text style={styles.emptyTitle}>{t('admin.no_data_title')}</Text>
                <Text style={styles.emptySub}>{t('admin.no_data_hint')}</Text>
              </Card>
            ) : (
              schedulesRows.slice(0, 3).map((item, idx) => (
                <Card key={item.install_id || idx} style={styles.rowCard}>
                  <View style={styles.rowTop}>
                    <View style={styles.platformBadge}>
                      <Ionicons
                        name={item.platform === 'ios' ? 'logo-apple' : 'phone-portrait-outline'}
                        size={12}
                        color={Colors.text.secondary}
                      />
                      <Text style={styles.platformText}>{item.timezone || 'Europe/Prague'}</Text>
                    </View>
                    <Text style={styles.timeAgo}>
                      {new Date(item.updated_at).toLocaleDateString('cs-CZ', {
                        day: 'numeric',
                        month: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  <View style={styles.scheduleDetails}>
                    <View style={styles.schedulePill}>
                      <Ionicons name="barbell-outline" size={13} color={Colors.accent.main} />
                      <Text style={styles.schedulePillText}>
                        Trénink: {item.practice_hour}:
                        {String(item.practice_minute).padStart(2, '0')} (
                        {item.practice_enabled ? 'ZAP' : 'VYP'})
                      </Text>
                    </View>
                    {item.morning_enabled && (
                      <View style={styles.schedulePill}>
                        <Ionicons name="sunny-outline" size={13} color="#D97706" />
                        <Text style={styles.schedulePillText}>
                          Ráno: {item.morning_hour}:
                          {String(item.morning_minute).padStart(2, '0')}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.smallInstallId}>ID: {item.install_id}</Text>
                </Card>
              ))
            )}

            {/* RLS Policy Helper Banner */}
            <Card style={styles.rlsCard}>
              <View style={styles.rlsHeader}>
                <Ionicons name="shield-half-outline" size={20} color={Colors.accent.main} />
                <Text style={styles.rlsTitle}>Povolení čtení dat v Supabase</Text>
              </View>
              <Text style={styles.rlsDesc}>
                Pokud vidíš u některých tabulek 0 záznamů, stačí v Supabase SQL Editoru 1× spustit
                politiku pro čtení přihlášeným adminem.
              </Text>
              <View style={styles.rlsBtnRow}>
                <TouchableOpacity style={styles.copyRlsBtn} onPress={copyRlsSql}>
                  <Ionicons
                    name={copiedRls ? 'checkmark-circle' : 'copy-outline'}
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.copyRlsBtnText}>
                    {copiedRls ? t('admin.rls_copied') : t('admin.copy_rls_sql')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.openStudioOutlineBtn}
                  onPress={() => Linking.openURL(SUPABASE_STUDIO_URL)}
                >
                  <Ionicons name="open-outline" size={16} color={Colors.accent.main} />
                  <Text style={styles.openStudioOutlineText}>SQL Editor ↗</Text>
                </TouchableOpacity>
              </View>
            </Card>

            {/* Collapsible Dev Tools Drawer */}
            <TouchableOpacity
              style={styles.toggleDevToolsBtn}
              onPress={() => {
                hapticPress();
                setShowDevTools(!showDevTools);
              }}
            >
              <Ionicons
                name={showDevTools ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={Colors.text.secondary}
              />
              <Text style={styles.toggleDevToolsText}>{t('admin.section_devtools')}</Text>
            </TouchableOpacity>

            {showDevTools && (
              <Card style={styles.testsCard}>
                {/* Test 1: Onboarding Answers */}
                <View style={styles.testItem}>
                  <View style={styles.testInfo}>
                    <Text style={styles.testItemTitle}>1. onboarding_answers</Text>
                    <Text style={styles.testItemSub}>Ověří uložení kompletního dotazníku</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.testActionBtn}
                    onPress={handleTestAnswers}
                    disabled={testingAnswers}
                  >
                    {testingAnswers ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.testActionText}>Odeslat</Text>
                    )}
                  </TouchableOpacity>
                </View>
                {answersResult && <Text style={styles.resultText}>{answersResult}</Text>}

                <View style={styles.divider} />

                {/* Test 2: Research Check-in */}
                <View style={styles.testItem}>
                  <View style={styles.testInfo}>
                    <Text style={styles.testItemTitle}>2. research_balbuties_data</Text>
                    <Text style={styles.testItemSub}>Klinický záznam (rating 4/5, spánek, voda)</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.testActionBtn}
                    onPress={handleTestResearch}
                    disabled={testingResearch}
                  >
                    {testingResearch ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.testActionText}>Odeslat</Text>
                    )}
                  </TouchableOpacity>
                </View>
                {researchResult && <Text style={styles.resultText}>{researchResult}</Text>}

                <View style={styles.divider} />

                {/* Test 3: Analytics Event */}
                <View style={styles.testItem}>
                  <View style={styles.testInfo}>
                    <Text style={styles.testItemTitle}>3. analytics_events</Text>
                    <Text style={styles.testItemSub}>Analytický event admin_test_ping</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.testActionBtn}
                    onPress={handleTestEvent}
                    disabled={testingEvent}
                  >
                    {testingEvent ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.testActionText}>Odeslat</Text>
                    )}
                  </TouchableOpacity>
                </View>
                {eventResult && <Text style={styles.resultText}>{eventResult}</Text>}

                <View style={styles.divider} />

                {/* Test 4: Notification Schedule */}
                <View style={styles.testItem}>
                  <View style={styles.testInfo}>
                    <Text style={styles.testItemTitle}>4. user_notification_schedules</Text>
                    <Text style={styles.testItemSub}>Aktuální nastavení notifikací a časové zóny</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.testActionBtn}
                    onPress={handleTestSchedule}
                    disabled={testingSchedule}
                  >
                    {testingSchedule ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.testActionText}>Odeslat</Text>
                    )}
                  </TouchableOpacity>
                </View>
                {scheduleResult && <Text style={styles.resultText}>{scheduleResult}</Text>}
              </Card>
            )}
          </View>
        )}

        {/* ==========================================================
            TAB 2: ONBOARDING ANSWERS
        ========================================================== */}
        {activeTab === 'onboarding' && (
          <View>
            <View style={styles.tableHeaderRow}>
              <View>
                <Text style={styles.tableTitle}>Odpovědi z úvodního dotazníku</Text>
                <Text style={styles.tableCountBadge}>
                  {t('admin.rows_count', { count: filteredOnboarding.length })}
                </Text>
              </View>
              {filteredOnboarding.length > 0 && (
                <TouchableOpacity
                  style={styles.exportCsvBtn}
                  onPress={() => {
                    hapticPress();
                    exportOnboardingCsv(filteredOnboarding);
                  }}
                >
                  <Ionicons name="download-outline" size={13} color={Colors.accent.main} />
                  <Text style={styles.exportCsvBtnText}>{t('admin.export_csv')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {filteredOnboarding.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="clipboard-outline" size={36} color={Colors.text.tertiary} />
                <Text style={styles.emptyTitle}>{t('admin.no_data_title')}</Text>
                <Text style={styles.emptySub}>{t('admin.no_data_hint')}</Text>
                <TouchableOpacity style={styles.emptyActionBtn} onPress={handleTestAnswers}>
                  <Text style={styles.emptyActionBtnText}>+ Vložit testovací řádek dotazníku</Text>
                </TouchableOpacity>
              </Card>
            ) : (
              filteredOnboarding.map((row, idx) => (
                <PressableCard
                  key={row.id || idx}
                  style={styles.rowCard}
                  onPress={() => setSelectedRecord(row)}
                >
                  <View style={styles.rowTop}>
                    <View style={styles.platformBadge}>
                      <Ionicons
                        name={row.platform === 'ios' ? 'logo-apple' : 'phone-portrait-outline'}
                        size={12}
                        color={Colors.text.secondary}
                      />
                      <Text style={styles.platformText}>
                        {row.platform || 'app'} · v{row.app_version || '1.0'}
                      </Text>
                    </View>
                    <Text style={styles.timeAgo}>
                      {new Date(row.created_at).toLocaleDateString('cs-CZ', {
                        day: 'numeric',
                        month: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  {/* Goal */}
                  <View style={styles.goalRow}>
                    <Text style={styles.goalLabel}>Cíl:</Text>
                    <Text style={styles.goalText}>🎯 {row.goal || 'Nezadáno'}</Text>
                  </View>

                  {/* Situations */}
                  {Array.isArray(row.situations) && row.situations.length > 0 && (
                    <View style={styles.chipWrap}>
                      {row.situations.map((sit, sIdx) => (
                        <View key={sIdx} style={styles.chip}>
                          <Text style={styles.chipText}>{sit}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Meta stats */}
                  <View style={styles.rowMetaFooter}>
                    <Text style={styles.metaStatText}>
                      👤 {row.age_group || 'Dospělý'} · ⏱️ {row.daily_minutes || 15} min/den
                    </Text>
                    {row.scenario_title && (
                      <Text style={styles.metaScenarioText} numberOfLines={1}>
                        🎬 {row.scenario_title}
                      </Text>
                    )}
                  </View>

                  <Text style={styles.smallInstallId}>ID: {row.install_id}</Text>
                </PressableCard>
              ))
            )}
          </View>
        )}

        {/* ==========================================================
            TAB 3: CLINICAL BALBUTIES RESEARCH
        ========================================================== */}
        {activeTab === 'research' && (
          <View>
            <View style={styles.tableHeaderRow}>
              <View>
                <Text style={styles.tableTitle}>Klinická data pro výzkum balbuties</Text>
                <Text style={styles.tableCountBadge}>
                  {t('admin.rows_count', { count: filteredResearch.length })}
                </Text>
              </View>
              {filteredResearch.length > 0 && (
                <TouchableOpacity
                  style={styles.exportCsvBtn}
                  onPress={() => {
                    hapticPress();
                    exportResearchCsv(filteredResearch);
                  }}
                >
                  <Ionicons name="download-outline" size={13} color={Colors.accent.main} />
                  <Text style={styles.exportCsvBtnText}>{t('admin.export_csv')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {filteredResearch.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="flask-outline" size={36} color={Colors.text.tertiary} />
                <Text style={styles.emptyTitle}>{t('admin.no_data_title')}</Text>
                <Text style={styles.emptySub}>{t('admin.no_data_hint')}</Text>
                <TouchableOpacity style={styles.emptyActionBtn} onPress={handleTestResearch}>
                  <Text style={styles.emptyActionBtnText}>+ Vložit testovací záznam výzkumu</Text>
                </TouchableOpacity>
              </Card>
            ) : (
              filteredResearch.map((row, idx) => (
                <PressableCard
                  key={row.id || idx}
                  style={styles.rowCard}
                  onPress={() => setSelectedRecord(row)}
                >
                  <View style={styles.rowTop}>
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingStars}>
                        {'★'.repeat(row.speech_rating)}
                        {'☆'.repeat(Math.max(0, 5 - row.speech_rating))}
                      </Text>
                      <Text style={styles.ratingScore}>{row.speech_rating} / 5</Text>
                    </View>
                    <Text style={styles.timeAgo}>{row.date}</Text>
                  </View>

                  <View style={styles.researchMetricsRow}>
                    {row.sleep_hours !== undefined && (
                      <View style={styles.metricItem}>
                        <Ionicons name="moon-outline" size={14} color="#6366F1" />
                        <Text style={styles.metricText}>{row.sleep_hours}h spánku</Text>
                      </View>
                    )}
                    {row.water_glasses !== undefined && (
                      <View style={styles.metricItem}>
                        <Ionicons name="water-outline" size={14} color="#0EA5E9" />
                        <Text style={styles.metricText}>{row.water_glasses} sklenic vody</Text>
                      </View>
                    )}
                    {row.weather && (
                      <View style={styles.metricItem}>
                        <Ionicons name="partly-sunny-outline" size={14} color="#F59E0B" />
                        <Text style={styles.metricText}>{row.weather}</Text>
                      </View>
                    )}
                  </View>

                  {/* Somatic tags */}
                  {Array.isArray(row.somatic_tags) && row.somatic_tags.length > 0 && (
                    <View style={styles.chipWrap}>
                      {row.somatic_tags.map((tag, tIdx) => (
                        <View key={tIdx} style={[styles.chip, styles.somaticChip]}>
                          <Text style={styles.somaticChipText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <Text style={styles.smallInstallId}>ID: {row.install_id}</Text>
                </PressableCard>
              ))
            )}
          </View>
        )}

        {/* ==========================================================
            TAB 4: ANALYTICS EVENTS
        ========================================================== */}
        {activeTab === 'analytics' && (
          <View>
            <View style={styles.tableHeaderRow}>
              <View>
                <Text style={styles.tableTitle}>Živý stream produktových událostí</Text>
                <Text style={styles.tableCountBadge}>
                  {t('admin.rows_count', { count: filteredAnalytics.length })}
                </Text>
              </View>
              {filteredAnalytics.length > 0 && (
                <TouchableOpacity
                  style={styles.exportCsvBtn}
                  onPress={() => {
                    hapticPress();
                    exportAnalyticsCsv(filteredAnalytics);
                  }}
                >
                  <Ionicons name="download-outline" size={13} color={Colors.accent.main} />
                  <Text style={styles.exportCsvBtnText}>{t('admin.export_csv')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {filteredAnalytics.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="pulse-outline" size={36} color={Colors.text.tertiary} />
                <Text style={styles.emptyTitle}>{t('admin.no_data_title')}</Text>
                <Text style={styles.emptySub}>{t('admin.no_data_hint')}</Text>
                <TouchableOpacity style={styles.emptyActionBtn} onPress={handleTestEvent}>
                  <Text style={styles.emptyActionBtnText}>+ Vložit testovací analytický event</Text>
                </TouchableOpacity>
              </Card>
            ) : (
              filteredAnalytics.map((row, idx) => (
                <PressableCard
                  key={row.id || idx}
                  style={styles.rowCard}
                  onPress={() => setSelectedRecord(row)}
                >
                  <View style={styles.rowTop}>
                    <View style={styles.eventChip}>
                      <Ionicons name="flash" size={12} color={Colors.accent.main} />
                      <Text style={styles.eventChipText}>{row.event}</Text>
                    </View>
                    <Text style={styles.timeAgo}>
                      {new Date(row.created_at).toLocaleTimeString('cs-CZ', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </Text>
                  </View>

                  {/* Properties summary */}
                  {row.properties && Object.keys(row.properties).length > 0 && (
                    <View style={styles.propertiesBox}>
                      <Text style={styles.propertiesText} numberOfLines={2}>
                        {JSON.stringify(row.properties)}
                      </Text>
                    </View>
                  )}

                  <Text style={styles.smallInstallId}>
                    ID: {row.install_id} · {row.platform || 'app'}
                  </Text>
                </PressableCard>
              ))
            )}
          </View>
        )}

        {/* ==========================================================
            TAB 5: NOTIFICATION SCHEDULES
        ========================================================== */}
        {activeTab === 'schedules' && (
          <View>
            <View style={styles.tableHeaderRow}>
              <View>
                <Text style={styles.tableTitle}>Rozvrhy notifikací a časová pásma</Text>
                <Text style={styles.tableCountBadge}>
                  {t('admin.rows_count', { count: filteredSchedules.length })}
                </Text>
              </View>
              {filteredSchedules.length > 0 && (
                <TouchableOpacity
                  style={styles.exportCsvBtn}
                  onPress={() => {
                    hapticPress();
                    exportSchedulesCsv(filteredSchedules);
                  }}
                >
                  <Ionicons name="download-outline" size={13} color={Colors.accent.main} />
                  <Text style={styles.exportCsvBtnText}>{t('admin.export_csv')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {filteredSchedules.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="time-outline" size={36} color={Colors.text.tertiary} />
                <Text style={styles.emptyTitle}>{t('admin.no_data_title')}</Text>
                <Text style={styles.emptySub}>{t('admin.no_data_hint')}</Text>
              </Card>
            ) : (
              filteredSchedules.map((row, idx) => (
                <PressableCard
                  key={row.install_id || idx}
                  style={styles.rowCard}
                  onPress={() => setSelectedRecord(row)}
                >
                  <View style={styles.rowTop}>
                    <View style={styles.platformBadge}>
                      <Ionicons name="globe-outline" size={12} color={Colors.text.secondary} />
                      <Text style={styles.platformText}>{row.timezone}</Text>
                    </View>
                    <Text style={styles.timeAgo}>
                      {new Date(row.updated_at).toLocaleDateString('cs-CZ', {
                        day: 'numeric',
                        month: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  <View style={styles.scheduleRowGrid}>
                    <View style={styles.scheduleGridItem}>
                      <Text style={styles.scheduleGridLabel}>Denní trénink</Text>
                      <Text style={styles.scheduleGridVal}>
                        {row.practice_hour}:{String(row.practice_minute).padStart(2, '0')}{' '}
                        {row.practice_enabled ? '✓' : '✗'}
                      </Text>
                    </View>

                    <View style={styles.scheduleGridItem}>
                      <Text style={styles.scheduleGridLabel}>Ranní check-in</Text>
                      <Text style={styles.scheduleGridVal}>
                        {row.morning_hour}:{String(row.morning_minute).padStart(2, '0')}{' '}
                        {row.morning_enabled ? '✓' : '✗'}
                      </Text>
                    </View>

                    <View style={styles.scheduleGridItem}>
                      <Text style={styles.scheduleGridLabel}>Streak saver</Text>
                      <Text style={styles.scheduleGridVal}>
                        {row.streak_saver_hour}:{String(row.streak_saver_minute).padStart(2, '0')}{' '}
                        {row.streak_saver_enabled ? '✓' : '✗'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.smallInstallId}>ID: {row.install_id}</Text>
                </PressableCard>
              ))
            )}
          </View>
        )}

        {/* ==========================================================
            TAB 6: VIP PROMO CODES
        ========================================================== */}
        {activeTab === 'vip' && (
          <View>
            <View style={styles.tableHeaderRow}>
              <View>
                <Text style={styles.tableTitle}>VIP Promo kódy</Text>
                <Text style={styles.tableCountBadge}>
                  {t('admin.rows_count', { count: filteredVip.length })}
                </Text>
              </View>
              {filteredVip.length > 0 && (
                <TouchableOpacity
                  style={styles.exportCsvBtn}
                  onPress={() => {
                    hapticPress();
                    exportVipCsv(filteredVip);
                  }}
                >
                  <Ionicons name="download-outline" size={13} color={Colors.accent.main} />
                  <Text style={styles.exportCsvBtnText}>{t('admin.export_csv')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {filteredVip.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="gift-outline" size={36} color={Colors.text.tertiary} />
                <Text style={styles.emptyTitle}>{t('admin.no_data_title')}</Text>
                <Text style={styles.emptySub}>
                  VIP kódy se spravují v tabulce public.vip_promo_codes v Supabase.
                </Text>
              </Card>
            ) : (
              filteredVip.map((row, idx) => (
                <PressableCard
                  key={row.code || idx}
                  style={styles.rowCard}
                  onPress={() => setSelectedRecord(row)}
                >
                  <View style={styles.rowTop}>
                    <Text style={styles.vipCodeTitle}>{row.code}</Text>
                    <View
                      style={[
                        styles.activeBadge,
                        { backgroundColor: row.is_active ? '#D1FAE5' : '#FEE2E2' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.activeBadgeText,
                          { color: row.is_active ? '#065F46' : '#991B1B' },
                        ]}
                      >
                        {row.is_active ? 'Aktivní' : 'Neaktivní'}
                      </Text>
                    </View>
                  </View>

                  {row.description && <Text style={styles.vipDesc}>{row.description}</Text>}

                  <View style={styles.vipMetaRow}>
                    <Text style={styles.vipMetaText}>
                      Uplatněno: {row.times_redeemed} / {row.max_redemptions ?? '∞'}
                    </Text>
                    {row.duration_days && (
                      <Text style={styles.vipMetaText}>Délka: {row.duration_days} dní</Text>
                    )}
                  </View>
                </PressableCard>
              ))
            )}
          </View>
        )}

        {/* ==========================================================
            TAB 7: THERAPISTS (therapist_patients)
        ========================================================== */}
        {activeTab === 'therapists' && (
          <View>
            <View style={styles.tableHeaderRow}>
              <View>
                <Text style={styles.tableTitle}>therapist_patients</Text>
                <Text style={styles.tableCountBadge}>
                  {t('admin.rows_count', { count: filteredTherapists.length })}
                </Text>
              </View>
              {filteredTherapists.length > 0 && (
                <TouchableOpacity
                  style={styles.exportCsvBtn}
                  onPress={() => {
                    hapticPress();
                    exportTherapistPatientsCsv(filteredTherapists);
                  }}
                >
                  <Ionicons name="download-outline" size={13} color={Colors.accent.main} />
                  <Text style={styles.exportCsvBtnText}>{t('admin.export_csv')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {filteredTherapists.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="medkit-outline" size={36} color={Colors.text.tertiary} />
                <Text style={styles.emptyTitle}>{t('admin.no_data_title')}</Text>
                <Text style={styles.emptySub}>
                  Zatím nebyl propojen žádný pacient s logopedem nebo klinikou.
                </Text>
              </Card>
            ) : (
              filteredTherapists.map((row, idx) => (
                <PressableCard
                  key={row.id || row.patient_code || idx}
                  style={styles.rowCard}
                  onPress={() => setSelectedRecord(row)}
                >
                  <View style={styles.rowTop}>
                    <View style={styles.codePill}>
                      <Ionicons name="medkit" size={14} color={Colors.accent.main} />
                      <Text style={styles.codePillText}>{row.patient_code}</Text>
                    </View>
                    <View
                      style={[
                        styles.activeBadge,
                        { backgroundColor: row.status === 'active' ? '#D1FAE5' : '#F3F4F6' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.activeBadgeText,
                          { color: row.status === 'active' ? '#065F46' : '#6B7280' },
                        ]}
                      >
                        {row.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.therapistNameRow}>
                    {row.therapist_name || 'Nezadané jméno logopeda'}
                    {row.clinic_name ? ` · ${row.clinic_name}` : ''}
                  </Text>

                  {row.notes && <Text style={styles.therapistNotes}>{row.notes}</Text>}

                  <View style={styles.vipMetaRow}>
                    <Text style={styles.vipMetaText}>
                      Upraveno: {new Date(row.updated_at || row.created_at).toLocaleDateString('cs-CZ')}
                    </Text>
                    {row.patient_alias && (
                      <Text style={styles.vipMetaText}>Alias: {row.patient_alias}</Text>
                    )}
                  </View>
                </PressableCard>
              ))
            )}
          </View>
        )}

        {/* Record Details Modal Overlay */}
        {selectedRecord && (
          <View style={styles.modalBackdrop}>
            <Card style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('admin.details_modal_title')}</Text>
                <TouchableOpacity onPress={() => setSelectedRecord(null)} hitSlop={10}>
                  <Ionicons name="close" size={22} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text style={styles.rawJsonText}>
                  {JSON.stringify(selectedRecord, null, 2)}
                </Text>
              </ScrollView>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedRecord(null)}
              >
                <Text style={styles.modalCloseText}>{t('admin.close')}</Text>
              </TouchableOpacity>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg.base,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.hairline,
  },
  closeBtn: {
    marginRight: 8,
    padding: 4,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  headerSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  refreshTopBtn: {
    padding: 8,
    marginRight: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.pill,
    backgroundColor: '#FEE2E2',
  },
  logoutBtnText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.danger.panic,
  },
  scroll: {
    padding: 16,
    paddingBottom: 48,
  },

  // KPI Horizontal Scroll
  kpiScroll: {
    gap: 10,
    paddingBottom: 14,
  },
  kpiCard: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.cardSmall,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 125,
    borderWidth: 1,
    borderColor: Colors.hairline,
    ...Shadow.card,
  },
  kpiCardActive: {
    borderColor: Colors.accent.main,
    backgroundColor: '#F0FDF4',
  },
  kpiLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
  },
  kpiValue: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.screenTitle,
    color: Colors.text.primary,
    marginTop: 4,
  },
  kpiHint: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: 10,
    color: Colors.text.tertiary,
    marginTop: 2,
  },

  // Tab chips
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface.card2,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  tabChipActive: {
    backgroundColor: Colors.accent.main,
    borderColor: Colors.accent.main,
  },
  tabChipText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.text.primary,
  },
  tabChipTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface.card,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: 10,
    color: Colors.text.secondary,
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.chip,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.hairline,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
    padding: 0,
  },

  // Live status card
  statusCard: {
    padding: 16,
    marginBottom: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusTitle: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  latencyBadge: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.accent.main,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.hairline,
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  metaLabel: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
  },
  metaValue: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.text.primary,
    maxWidth: '65%',
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '65%',
  },
  installIdText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.primary,
  },

  // Table items & card
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tableTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  tableCountBadge: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
  },
  exportCsvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E4F2EA',
    borderWidth: 1,
    borderColor: '#C6DDD2',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.pill,
  },
  exportCsvBtnText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.accent.main,
  },
  rowCard: {
    padding: 14,
    marginBottom: 10,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface.card2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  platformText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
  },
  timeAgo: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
  },

  // Onboarding items
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  goalLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
  },
  goalText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  chip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  chipText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  rowMetaFooter: {
    marginTop: 6,
    gap: 2,
  },
  metaStatText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
  },
  metaScenarioText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
  },
  smallInstallId: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: 10,
    color: Colors.text.tertiary,
    marginTop: 6,
  },

  // Research items
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingStars: {
    color: '#F59E0B',
    fontSize: 14,
    letterSpacing: 2,
  },
  ratingScore: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.text.primary,
  },
  researchMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 6,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
  },
  somaticChip: {
    backgroundColor: '#FEF3C7',
  },
  somaticChipText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: 11,
    color: '#92400E',
  },

  // Analytics items
  eventChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  eventChipText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.accent.main,
  },
  propertiesBox: {
    backgroundColor: Colors.surface.card2,
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  propertiesText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: 11,
    color: Colors.text.secondary,
  },

  // Schedule items
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 8,
  },
  sectionHeader: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  seeAllText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.accent.main,
  },
  scheduleDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  schedulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface.card2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  schedulePillText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.primary,
  },
  scheduleRowGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  scheduleGridItem: {
    flex: 1,
  },
  scheduleGridLabel: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  scheduleGridVal: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.text.primary,
    marginTop: 2,
  },

  // VIP
  vipCodeTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.cardTitle,
    color: Colors.accent.main,
  },
  vipDesc: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  vipMetaRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 6,
  },
  vipMetaText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  activeBadgeText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: 10,
  },

  // RLS Banner
  rlsCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    padding: 14,
    marginTop: 14,
  },
  rlsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rlsTitle: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.accent.main,
  },
  rlsDesc: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    marginTop: 4,
    lineHeight: 18,
  },
  rlsBtnRow: {
    gap: 8,
    marginTop: 10,
  },
  copyRlsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.accent.main,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.chip,
  },
  copyRlsBtnText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: '#FFFFFF',
  },
  openStudioOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.accent.main,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.chip,
  },
  openStudioOutlineText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.accent.main,
  },

  // Dev tools toggle & tests
  toggleDevToolsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 10,
  },
  toggleDevToolsText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
  },
  testsCard: {
    padding: 14,
    marginBottom: 16,
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  testInfo: {
    flex: 1,
    marginRight: 10,
  },
  testItemTitle: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
  },
  testItemSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  testActionBtn: {
    backgroundColor: Colors.accent.main,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.chip,
    minWidth: 70,
    alignItems: 'center',
  },
  testActionText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: '#FFFFFF',
  },
  resultText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.accent.main,
    marginTop: 4,
    marginBottom: 6,
  },

  // Empty states
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
    marginTop: 8,
  },
  emptySub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  emptyActionBtn: {
    backgroundColor: Colors.surface.card2,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    marginTop: 14,
  },
  emptyActionBtnText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.accent.main,
  },

  // Details Modal
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    padding: 16,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.cardSmall,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  modalBody: {
    maxHeight: 350,
  },
  rawJsonText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: Colors.text.primary,
    backgroundColor: Colors.surface.card2,
    padding: 12,
    borderRadius: 8,
  },
  modalCloseBtn: {
    backgroundColor: Colors.accent.main,
    paddingVertical: 10,
    borderRadius: Radius.chip,
    alignItems: 'center',
    marginTop: 14,
  },
  modalCloseText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: '#FFFFFF',
  },

  // Gatekeeper styles
  gateHero: {
    alignItems: 'center',
    marginVertical: 24,
  },
  lockBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  gateTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.screenTitle,
    color: Colors.text.primary,
  },
  gateSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  cardPad: {
    padding: 18,
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.surface.card2,
    borderRadius: Radius.chip,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: Radius.chip,
    marginTop: 12,
  },
  errorBoxText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.danger.panic,
    flex: 1,
  },
  loginBtn: {
    backgroundColor: Colors.accent.main,
    paddingVertical: 14,
    borderRadius: Radius.chip,
    alignItems: 'center',
    marginTop: 18,
  },
  loginBtnText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: '#FFFFFF',
  },
  whereCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    padding: 16,
  },
  whereHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  whereTitle: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.accent.main,
  },
  whereDesc: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    marginTop: 6,
    lineHeight: 18,
  },
  openStudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.accent.main,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.chip,
    marginTop: 12,
  },
  openStudioBtnText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: '#FFFFFF',
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface.card2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codePillText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: FontSize.bodySmall,
    color: Colors.accent.main,
    letterSpacing: 0.5,
  },
  therapistNameRow: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.body,
    color: Colors.text.primary,
    marginTop: 6,
  },
  therapistNotes: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    marginTop: 4,
  },
});
