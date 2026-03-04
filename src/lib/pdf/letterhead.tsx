// ============================================================
// @react-pdf/renderer Branded Letterhead Template
// Wraps all structured-data PDFs with Blackstone branding
// ============================================================

import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { BRAND, FONT_SIZES, PAGE_MARGINS } from './pdf-styles';

const styles = StyleSheet.create({
  page: {
    paddingTop: PAGE_MARGINS.top,
    paddingBottom: PAGE_MARGINS.bottom + 20,
    paddingLeft: PAGE_MARGINS.left,
    paddingRight: PAGE_MARGINS.right,
    fontFamily: 'Helvetica',
    fontSize: FONT_SIZES.body,
    color: BRAND.onyx,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: BRAND.onyx,
    paddingBottom: 10,
    marginBottom: 16,
  },
  companyName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  projectInfo: {
    fontSize: 9,
    color: BRAND.warmGray,
    marginTop: 4,
  },
  titleBlock: {
    marginBottom: 16,
  },
  documentTitle: {
    fontSize: FONT_SIZES.subtitle,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  documentDate: {
    fontSize: 9,
    color: BRAND.warmGray,
  },
  content: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: PAGE_MARGINS.bottom / 2,
    left: PAGE_MARGINS.left,
    right: PAGE_MARGINS.right,
    borderTopWidth: 1,
    borderTopColor: BRAND.borderGray,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidentiality: {
    fontSize: FONT_SIZES.footer,
    color: BRAND.warmGray,
    maxWidth: '80%',
  },
  pageNumber: {
    fontSize: FONT_SIZES.footer,
    color: BRAND.warmGray,
  },
});

interface LetterheadProps {
  projectName: string;
  projectAddress: string;
  documentTitle: string;
  documentDate: string;
  children: React.ReactNode;
}

export function LetterheadDocument({
  projectName,
  projectAddress,
  documentTitle,
  documentDate,
  children,
}: LetterheadProps) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.companyName}>Blackstone Construction</Text>
          <Text style={styles.projectInfo}>
            {projectName} | {projectAddress}
          </Text>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.documentTitle}>{documentTitle}</Text>
          <Text style={styles.documentDate}>{documentDate}</Text>
        </View>

        <View style={styles.content}>{children}</View>

        <View style={styles.footer} fixed>
          <Text style={styles.confidentiality}>
            CONFIDENTIAL — Blackstone Construction, LLC. This document may
            contain privileged information.
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

// ── Shared sub-component styles for document renderers ──

export const docStyles = StyleSheet.create({
  sectionTitle: {
    fontSize: FONT_SIZES.heading,
    fontFamily: 'Helvetica-Bold',
    marginTop: 14,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.borderGray,
  },
  table: {
    width: '100%',
    marginBottom: 8,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: BRAND.lightGray,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.borderGray,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND.borderGray,
    paddingVertical: 3,
    paddingHorizontal: 4,
    minHeight: 18,
  },
  tableHeaderCell: {
    fontSize: FONT_SIZES.small,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.slate,
  },
  tableCell: {
    fontSize: FONT_SIZES.small,
    color: BRAND.onyx,
  },
  keyValueRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  keyLabel: {
    fontSize: FONT_SIZES.body,
    fontFamily: 'Helvetica-Bold',
    width: 140,
    color: BRAND.slate,
  },
  keyValue: {
    fontSize: FONT_SIZES.body,
    flex: 1,
    color: BRAND.onyx,
  },
  textBlock: {
    fontSize: FONT_SIZES.body,
    lineHeight: 1.5,
    color: BRAND.onyx,
    marginBottom: 6,
  },
  badge: {
    fontSize: FONT_SIZES.small,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: BRAND.lightGray,
    padding: 10,
    borderRadius: 4,
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: FONT_SIZES.subtitle,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.onyx,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.small,
    color: BRAND.warmGray,
    marginTop: 2,
  },
});
