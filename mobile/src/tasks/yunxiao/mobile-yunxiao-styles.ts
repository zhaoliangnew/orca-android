import { colors, feedback, radii, spacing, typography } from '../../theme/mobile-theme'
import { themedStyleSheet } from '../../theme/themed-styles'

// leniu: the phone's 云效 list and detail, in the Tasks page's palette.
export const yunxiaoStyles = themedStyleSheet(() => ({
  screen: { flex: 1, backgroundColor: colors.bgBase },
  chips: { gap: spacing.xs, paddingHorizontal: spacing.md },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.xs
  },
  pressed: { opacity: feedback.pressedOpacity },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  serial: {
    color: colors.textMuted,
    fontSize: typography.metaSize,
    fontFamily: typography.monoFamily
  },
  badge: {
    color: colors.statusGreen,
    fontSize: typography.metaSize,
    paddingHorizontal: 6,
    borderRadius: radii.mark,
    backgroundColor: colors.translucentFill,
    overflow: 'hidden'
  },
  status: { color: colors.textSecondary, fontSize: typography.metaSize },
  due: { marginLeft: 'auto', color: colors.textMuted, fontSize: typography.metaSize },
  subject: { color: colors.textPrimary, fontSize: typography.bodySize + 1, lineHeight: 21 },
  project: { color: colors.textMuted, fontSize: typography.metaSize },
  muted: { color: colors.textMuted },
  message: {
    color: colors.textSecondary,
    fontSize: typography.bodySize,
    textAlign: 'center',
    padding: spacing.xl
  },
  footer: {
    color: colors.textMuted,
    fontSize: typography.metaSize,
    textAlign: 'center',
    padding: spacing.lg
  },
  detail: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xl * 2 },
  error: { color: colors.statusRed, fontSize: typography.bodySize },
  kind: { color: colors.textMuted, fontSize: typography.metaSize },
  title: {
    color: colors.textPrimary,
    fontSize: typography.titleSize,
    fontWeight: '600',
    lineHeight: 26
  },
  section: {
    color: colors.textSecondary,
    fontSize: typography.metaSize,
    fontWeight: '600',
    marginTop: spacing.md
  },
  statusWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statusChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.bgRaised
  },
  statusChipActive: { backgroundColor: colors.accentBlue },
  statusText: { color: colors.textSecondary, fontSize: typography.bodySize },
  statusTextActive: { color: colors.onAccent, fontWeight: '600' },
  metaRow: { flexDirection: 'row', gap: spacing.md },
  metaLabel: { width: 64, color: colors.textMuted, fontSize: typography.bodySize },
  metaValue: { flex: 1, color: colors.textPrimary, fontSize: typography.bodySize },
  body: { color: colors.textPrimary, fontSize: typography.bodySize, lineHeight: 21 },
  comment: {
    padding: spacing.md,
    borderRadius: radii.surface,
    backgroundColor: colors.bgPanel,
    gap: spacing.xs
  },
  commentAuthor: { color: colors.textMuted, fontSize: typography.metaSize },
  input: {
    minHeight: 72,
    padding: spacing.md,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    color: colors.textPrimary,
    fontSize: typography.bodySize,
    textAlignVertical: 'top'
  },
  button: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.control,
    backgroundColor: colors.accentBlue
  },
  buttonText: { color: colors.onAccent, fontSize: typography.bodySize, fontWeight: '600' },
  disabled: { opacity: feedback.disabledOpacity }
}))
