import React, { useContext } from 'react'
import { useQuery } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import PropTypes from 'prop-types'
import * as d3 from 'd3'

// utility functions
import utils from '../../../../js/utils'
import { StoreContext } from '../../../../store'

import { DataFilterContext } from '../../../../stores/data-filter-store'
import { DATA_FILTER_CONSTANTS as DFC } from '../../../../constants'
import CONSTANTS from '../../../../js/constants'

import { makeStyles } from '@material-ui/core/styles'
import {
  Box,
  CircularProgress,
  useTheme
} from '@material-ui/core'

// import CloseIcon from '@material-ui/icons/Close'
// import IconMap from '-!svg-react-loader!../../../img/svg/icon-us-map.svg'
import CircleChart from '../../../data-viz/CircleChart/CircleChart.js'

const APOLLO_QUERY = gql`
  query ProductionTopLocations($year: Int!, $location: String!, $commodity: String!, $state: String!, $period: String!) {
    state_production_summary: production_summary(
      where: {
        # location_type - State, County, Offshore, Native American, Nationwide Federal
        location_type: {_eq: $location},
        # year - 2019
        year: { _eq: $year },
        # prduct ex - Oil (bbl)
        product: {_eq: $commodity},
        # fipsCode
        state: {_eq: $state},
        # Fiscal Year/Calendar Year
        period: {_eq: $period}
      },
        order_by: {total: desc}
      ) {
        location_name
        unit_abbr
        year
        location
        total
      }
    production_summary(
      where: {
        location_type: {_nin: ["Nationwide Federal", "County", ""]},
        location: {_neq: "null"},
        year: { _eq: $year }, 
        product: {_eq: $commodity},
        period: {_eq: $period}
      }, order_by: {total: desc}
      ) {
        location_name
        unit_abbr
        year
        location
        total
      }
  }
`

const useStyles = makeStyles(theme => ({
  root: {
    maxWidth: '100%',
    width: '100%',
    margin: theme.spacing(1),
    '@media (max-width: 768px)': {
      maxWidth: '100%',
      margin: 0,
    }
  },
  progressContainer: {
    maxWidth: '25%',
    display: 'flex',
    '& > *': {
      marginTop: theme.spacing(3),
      marginRight: 'auto',
      marginLeft: 'auto',
    }
  },
  circularProgressRoot: {
    color: theme.palette.primary.dark,
  },
  chartHorizontal: {
    '& .chart-container': {
      display: 'flex',
      // alignItems: 'top',
      '@media (max-width: 426px)': {
        display: 'block',
        margin: 0,
      },
      '& .chart': {
        marginRight: theme.spacing(2),
        width: '70%',
        '@media (max-width: 426px)': {
          marginRight: 0,
        },
      },
    },
  },
  chartVertical: {
    '& .chart-container': {
      display: 'block',
      margin: 0,
    },
    '& .chart': {
      margin: 0,
      width: '100%',
    },
  }
}))

const ProductionTopLocations = ({ title, ...props }) => {
  // console.log('ProudctionTopLocations props: ', props)
  const classes = useStyles()
  const theme = useTheme()
  const { state: filterState } = useContext(DataFilterContext)
  const year = (filterState[DFC.YEAR]) ? filterState[DFC.YEAR] : 2019
  const period = (filterState[DFC.PERIOD]) ? filterState[DFC.PERIOD] : DFC.PERIOD_FISCAL_YEAR

  let locationType
  const state = props.fipsCode || ''

  switch (props.regionType) {
  case CONSTANTS.STATE:
    locationType = CONSTANTS.COUNTY
    break
  case CONSTANTS.COUNTY:
    locationType = ''
    break
  case CONSTANTS.OFFSHORE:
    locationType = ''
    break
  default:
    locationType = props.fipsCode === 'NF' ? CONSTANTS.STATE : ''
    break
  }

  const commodity = (filterState[DFC.COMMODITY]) ? filterState[DFC.COMMODITY] : 'Oil (bbl)'
  const key = `PTL${ year }${ state }${ commodity }${ period }`

  const { loading, error, data } = useQuery(APOLLO_QUERY,
    {
      variables: { year, location: locationType, commodity, state, period },
      skip: props.fipsCode === DFC.NATIVE_AMERICAN_FIPS || props.regionType === CONSTANTS.COUNTY || props.regionType === CONSTANTS.OFFSHORE
    })

  if (loading) {
    return (
      <div className={classes.progressContainer}>
        <CircularProgress classes={{ root: classes.circularProgressRoot }} />
      </div>
    )
  }
  if (error) return `Error! ${ error.message }`

  let chartData = []
  let dataSet = (period === DFC.PERIOD_FISCAL_YEAR) ? `FY ${ year }` : `CY ${ year }`
  let unitAbbr = ''

  if (data && (data.state_production_summary.length || data.production_summary.length)) {
    if (data.state_production_summary.length > 0 && locationType === CONSTANTS.COUNTY) {
      unitAbbr = data.state_production_summary[0].unit_abbr
      chartData = d3.nest()
        .key(k => k.location_name)
        .rollup(v => d3.sum(v, i => i.total))
        .entries(data.state_production_summary).map(item => {
          const r = { total: item.value, location_name: item.key, unit_abbr: unitAbbr }
          return r
        })
    }
    else { // Don't show top locations for any card except state and nationwide federal
      // quick and dirty - most definately probably a better way to handle this
      if (locationType !== CONSTANTS.COUNTY) {
        unitAbbr = data.production_summary[0].unit_abbr
        let tmp = data.production_summary
        if (props.fipsCode) {
          tmp = data.production_summary.filter(d => d.location !== 'NA')
        }
        chartData = d3.nest()
          .key(k => k.location_name)
          .rollup(v => d3.sum(v, i => i.total))
          .entries(tmp).map(item => {
            const r = { total: item.value, location_name: item.key, unit_abbr: unitAbbr }
            return r
          })
      }
    }
    dataSet = dataSet + ` (${ unitAbbr })`

    if (chartData.length > 0) {
      return (
        <Box className={classes.root}>
          {title && <Box component="h4" fontWeight="bold" mb={2}>{title}</Box>}
          <Box className={props.horizontal ? classes.chartHorizontal : classes.chartVertical}>
            <CircleChart
              key={key}
              data={chartData}
              maxLegendWidth={props.maxLegendWidth}
              xAxis='location_name'
              yAxis='total'
              format={ d => utils.formatToCommaInt(d) }
              circleLabel={
                d => {
                  if (props.horizontal) {
                    const r = []
                    r[0] = d.location_name
                    if (r[0] === 'Native American') {
                      r[0] = 'Native American lands'
                    }
                    else if (r[0] === 'Gulf of Mexico, Central Gulf of Mexico') {
                      r[0] = 'Central Gulf'
                    }
                    else if (r[0] === 'Gulf of Mexico, Western Gulf of Mexico') {
                      r[0] = 'Western Gulf'
                    }
                    r[1] = utils.formatToCommaInt(d.total) + ' ' + d.unit_abbr
                    return r
                  }
                  else {
                    return ['', '']
                  }
                }
              }
              legendLabel={
                d => {
                  if (d === 'Native American') {
                    d = 'Native American lands'
                  }
                  return d
                }
              }
              xLabel={locationType}
              yLabel={dataSet}
              maxCircles={6}
              minColor={theme.palette.green[100]}
              maxColor={theme.palette.green[600]} />
          </Box>
        </Box>
      )
    }
    else {
      return <Box className={classes.root}></Box>
    }
  }
  else {
    return <Box className={classes.root}></Box>
  }
}

export default ProductionTopLocations

ProductionTopLocations.propTypes = {
  title: PropTypes.string
}
