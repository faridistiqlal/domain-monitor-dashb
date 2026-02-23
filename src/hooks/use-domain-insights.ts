import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Domain, DomainInsight } from '@/lib/types'

interface UseDomainInsightsParams {
  domains: Domain[]
  isAuthenticated: boolean
  onLoadError?: (message: string, error: unknown) => void
}

export function useDomainInsights({
  domains,
  isAuthenticated,
  onLoadError,
}: UseDomainInsightsParams) {
  const [domainInsights, setDomainInsights] = useState<Record<string, DomainInsight>>({})

  useEffect(() => {
    const loadDomainInsights = async () => {
      if (!isAuthenticated || !domains || domains.length === 0) {
        setDomainInsights({})
        return
      }

      try {
        const domainIds = new Set(domains.map(domain => domain.id))
        const cutoff30 = new Date()
        cutoff30.setDate(cutoff30.getDate() - 29)
        const cutoff7 = new Date()
        cutoff7.setDate(cutoff7.getDate() - 6)

        const cutoff30Str = cutoff30.toISOString().split('T')[0]
        const cutoff7Str = cutoff7.toISOString().split('T')[0]

        const statsQuery = query(
          collection(db, 'domain-stats-daily'),
          where('date', '>=', cutoff30Str)
        )

        const snapshot = await getDocs(statsQuery)

        const aggregateByDomain = new Map<string, {
          success7: number
          total7: number
          success30: number
          total30: number
          trend: Array<{ date: string; response: number }>
        }>()

        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data() as {
            domainId?: string
            date?: string
            successChecks?: number
            totalChecks?: number
            avgResponseTime?: number
          }

          if (!data.domainId || !domainIds.has(data.domainId) || !data.date) {
            return
          }

          const aggregate = aggregateByDomain.get(data.domainId) || {
            success7: 0,
            total7: 0,
            success30: 0,
            total30: 0,
            trend: [],
          }

          const successChecks = data.successChecks || 0
          const totalChecks = data.totalChecks || 0

          aggregate.success30 += successChecks
          aggregate.total30 += totalChecks

          if (data.date >= cutoff7Str) {
            aggregate.success7 += successChecks
            aggregate.total7 += totalChecks
          }

          if (typeof data.avgResponseTime === 'number' && data.avgResponseTime > 0) {
            aggregate.trend.push({ date: data.date, response: data.avgResponseTime })
          }

          aggregateByDomain.set(data.domainId, aggregate)
        })

        const nextInsights: Record<string, DomainInsight> = {}

        domains.forEach(domain => {
          const aggregate = aggregateByDomain.get(domain.id)
          if (!aggregate) {
            nextInsights[domain.id] = {
              uptime7d: null,
              uptime30d: null,
              responseTrend: [],
            }
            return
          }

          const uptime7d = aggregate.total7 > 0 ? (aggregate.success7 / aggregate.total7) * 100 : null
          const uptime30d = aggregate.total30 > 0 ? (aggregate.success30 / aggregate.total30) * 100 : null
          const responseTrend = aggregate.trend
            .sort((left, right) => left.date.localeCompare(right.date))
            .slice(-7)
            .map(item => Math.round(item.response))

          nextInsights[domain.id] = {
            uptime7d,
            uptime30d,
            responseTrend,
          }
        })

        setDomainInsights(nextInsights)
      } catch (error) {
        onLoadError?.('[Insights] Failed to load domain insights', error)
      }
    }

    loadDomainInsights()
  }, [domains, isAuthenticated, onLoadError])

  return domainInsights
}
