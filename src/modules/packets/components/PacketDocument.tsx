// React-PDF document for a job packet.
// Rendered server-side by @react-pdf/renderer's renderToBuffer / renderToStream.
// docs/DESIGN.md §4.3 Module 4: header + QR + stage checklist + manual-entry token tail.
//
// Notes:
//  - This file imports @react-pdf/renderer at top level. Per DESIGN.md the *route handler*
//    should lazy-load this whole module; the module itself doesn't need its own dynamic import.
//  - All layout uses StyleSheet — react-pdf doesn't accept className.

import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'

const PRODUCTION_STAGES = [
  'Received',
  'Prep',
  'Coating',
  'Curing',
  'QC',
  'Completed',
  'Picked Up',
] as const

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingBottom: 12,
    marginBottom: 16,
  },
  brand: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  brandSub: {
    color: '#666',
    marginTop: 2,
  },
  jobNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  jobNumberSub: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
    marginTop: 2,
  },
  body: {
    flexDirection: 'row',
    gap: 24,
  },
  qrColumn: {
    width: 280,
    alignItems: 'center',
  },
  qrImage: {
    width: 240,
    height: 240,
  },
  tokenTail: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: 'Courier',
    letterSpacing: 2,
    textAlign: 'center',
  },
  tokenTailLabel: {
    marginTop: 4,
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
  },
  detailsColumn: {
    flex: 1,
    gap: 6,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  fieldLabel: {
    width: 90,
    color: '#666',
  },
  fieldValue: {
    flex: 1,
  },
  jobName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  description: {
    marginTop: 8,
    fontSize: 10,
    lineHeight: 1.4,
  },
  stagesBlock: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingTop: 12,
  },
  stagesTitle: {
    fontSize: 10,
    color: '#666',
    marginBottom: 8,
  },
  stagesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stageCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: '#222',
    marginRight: 4,
  },
  stageLabel: {
    fontSize: 9,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 8,
    color: '#999',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})

export interface PacketJobData {
  job_number: string
  job_name: string
  description: string | null
  customer_po_number: string | null
  company_name: string
  contact_name: string | null
  color: string | null
  coating_type: string | null
  part_count: number | null
  weight_lbs: number | null
  dimensions_text: string | null
  due_date: string | null
  priority: string
  packet_token: string
}

export interface PacketTenantData {
  tenant_name: string
  brand_subtitle?: string | null
}

export interface PacketDocumentProps {
  job: PacketJobData
  tenant: PacketTenantData
  qrPngDataUrl: string
  generatedAt: string
}

function field(label: string, value: string | number | null) {
  if (value == null || value === '') return null
  return (
    <View style={styles.fieldRow} key={label}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{String(value)}</Text>
    </View>
  )
}

export function PacketDocument({ job, tenant, qrPngDataUrl, generatedAt }: PacketDocumentProps) {
  // Last 8 chars of packet_token as the manual-entry fallback (DESIGN.md).
  const tokenTail = job.packet_token.slice(-8).toUpperCase()

  return (
    <Document title={`Job Packet ${job.job_number}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>{tenant.tenant_name}</Text>
            {tenant.brand_subtitle ? (
              <Text style={styles.brandSub}>{tenant.brand_subtitle}</Text>
            ) : null}
          </View>
          <View>
            <Text style={styles.jobNumber}>{job.job_number}</Text>
            <Text style={styles.jobNumberSub}>{job.priority.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.qrColumn}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image renders to PDF, not HTML */}
            <Image style={styles.qrImage} src={qrPngDataUrl} />
            <Text style={styles.tokenTail}>{tokenTail}</Text>
            <Text style={styles.tokenTailLabel}>manual entry code</Text>
          </View>

          <View style={styles.detailsColumn}>
            <Text style={styles.jobName}>{job.job_name}</Text>
            {field('Customer', job.company_name)}
            {field('Contact', job.contact_name)}
            {field('PO #', job.customer_po_number)}
            {field('Color', job.color)}
            {field('Coating', job.coating_type)}
            {field('Parts', job.part_count)}
            {field('Weight', job.weight_lbs != null ? `${job.weight_lbs} lbs` : null)}
            {field('Dimensions', job.dimensions_text)}
            {field('Due', job.due_date)}
            {job.description ? (
              <Text style={styles.description}>{job.description}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.stagesBlock}>
          <Text style={styles.stagesTitle}>Production stages</Text>
          <View style={styles.stagesRow}>
            {PRODUCTION_STAGES.map((stage) => (
              <View key={stage} style={styles.stageCell}>
                <View style={styles.checkbox} />
                <Text style={styles.stageLabel}>{stage}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>Generated {generatedAt}</Text>
          <Text>Job Packet · scan QR or enter manual code at any workstation</Text>
        </View>
      </Page>
    </Document>
  )
}
