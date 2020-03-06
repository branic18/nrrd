import React, { Fragment, useState, useEffect, useRef, useContext } from 'react'
// import { Link } from "gatsby"
import { graphql } from 'gatsby'
import { useQuery } from '@apollo/react-hooks'
import gql from 'graphql-tag'

import { makeStyles } from '@material-ui/core/styles'
import Container from '@material-ui/core/Container'
import Typography from '@material-ui/core/Typography'
import Slider from '@material-ui/core/Slider'
import Paper from '@material-ui/core/Paper'
import Grid from '@material-ui/core/Grid'
import Box from '@material-ui/core/Box'
import ToggleButton from '@material-ui/lab/ToggleButton'
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import Fade from '@material-ui/core/Fade'

import StackedBarChart from '../../data-viz/StackedBarChart/StackedBarChart'
import { ExploreDataLink } from '../../layouts/IconLinks/ExploreDataLink'

import { StoreContext } from '../../../store'
import { ThemeConsumer } from 'styled-components'
import utils from '../../../js/utils'
import CONSTANTS from '../../../js/constants'

const TOGGLE_VALUES = {
  Year: 'year',
  Month: 'month'
}

const DROPDOWN_VALUES = {
  Recent: 'recent',
  Fiscal: 'fiscal',
  Calendar: 'calendar'
}

const YEARLY_DROPDOWN_VALUES = {
  Fiscal: 'fiscal_year'
}

const useStyles = makeStyles(theme => ({
  titleBar: {
    display: 'flex',
    justifyContent: 'space-between',
    '@media (max-width: 426px)': {
      display: 'block',
    }
  },
  titleLink: {
    fontSize: '1.2rem',
    marginBottom: 0,
    fontWeight: 'normal',
    height: 24,
    '@media (max-width: 426px)': {
      display: 'block',
      width: '100%',
    },
    '& span': {
      marginRight: 0,
    }
  },
  formControl: {
    margin: theme.spacing(0),
    minWidth: 120,
    textAlign: 'right',
  },
  selectEmpty: {
    marginTop: theme.spacing(2)
  },
  toggleButtonRoot: {
    textTransform: 'capitalize',
    '& .Mui-selected': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  toggleButtonSelected: {
    backgroundColor: `${ theme.palette.primary.dark } !important`,
  }
}))

const TOTAL_DISBURSEMENTS_QUERY = gql`
  query TotalYearlyDisbursements {
    total_yearly_fiscal_disbursement2 {
      year,
      source,
      sum
    }   

    total_monthly_fiscal_disbursement2 {
      source
      sum
      month_long
      period_date
      month
     year
    }
    total_monthly_calendar_disbursement2 {
      source
      sum
      month_long
      period_date
      month
     year

  } 
     last_twelve_disbursement2 {
      source
      sum
      month_long
      period_date
      month
     year

  } 
  }
`

// Total Revenu Controls, Menu
const TotalDisbursementControls = props => {
  const classes = useStyles()

  const inputLabel = useRef(null)

  const [period, setPeriod] = useState(YEARLY_DROPDOWN_VALUES.Fiscal)
  const [labelWidth, setLabelWidth] = useState(0)
  const [toggle, setToggle] = useState(TOGGLE_VALUES.Year)

  const handleToggle = (event, newVal) => {
    setToggle(newVal)
    props.onToggleChange(newVal)
    if (newVal && newVal.toLowerCase() === TOGGLE_VALUES.Month.toLowerCase()) {
      setPeriod(DROPDOWN_VALUES.Recent)
    }
    else {
      setPeriod(YEARLY_DROPDOWN_VALUES.Fiscal)
    }
  }

  useEffect(() => {
    setLabelWidth(inputLabel.current.offsetWidth)
  }, [])

  const handleChange = event => {
    setPeriod(event.target.value)
    props.onMenuChange(event.target.value)
  }

  return (
    <>
      <Grid item xs={6}>
        <ToggleButtonGroup
          value={toggle}
          exclusive
          onChange={handleToggle}
          size="large"
          aria-label="Toggle between Yearly and Monthly data">
          {
            Object.values(TOGGLE_VALUES).map((item, i) => (
              <ToggleButton
                key={i}
                value={item}
                aria-label={item}
                disableRipple
                classes={{
                  root: classes.toggleButtonRoot,
                  selected: classes.toggleButtonSelected,
                }}>{ item === 'year' ? CONSTANTS.YEARLY : CONSTANTS.MONTHLY }</ToggleButton>
            ))
          }
        </ToggleButtonGroup>
      </Grid>
      <Grid item xs={6} style={{ textAlign: 'right' }}>
        <FormControl variant="outlined" className={classes.formControl}>
          <InputLabel ref={inputLabel} id="demo-simple-select-outlined-label">
          Period
          </InputLabel>
          <Select
            labelId="Period label"
            id="period-label-select-outlined"
            value={period}
            onChange={handleChange}
            labelWidth={labelWidth}
          >
            {
              (toggle === 'year')
                ? Object.values(YEARLY_DROPDOWN_VALUES).map((item, i) => (
                  <MenuItem key={i} value={item}>{ item === 'calendar_year' ? CONSTANTS.CALENDAR_YEAR : CONSTANTS.FISCAL_YEAR }</MenuItem>
                ))
                : Object.values(DROPDOWN_VALUES).map((item, i) => (
                  <MenuItem value={item} key={i}>
                    {(() => {
                      switch (item) {
                      case 'fiscal':
                        return 'Fiscal year ' + props.maxFiscalYear
                      case 'calendar':
                        return 'Calendar year ' + props.maxCalendarYear
                      default:
                        return 'Most recent 12 months'
                      }
                    })()}
                  </MenuItem>
                ))
            }
          </Select>
        </FormControl>
      </Grid>
    </>
  )
}

const TotalDisbursements = props => {
  const classes = useStyles()
  const [period, setPeriod] = useState(YEARLY_DROPDOWN_VALUES.Fiscal)
  const [toggle, setToggle] = useState(DROPDOWN_VALUES.Year)
  const toggleChange = value => {
    // console.debug('ON TOGGLE CHANGE: ', value)
    setToggle(value)
  }
  const menuChange = value => {
    // console.debug('ON Menu CHANGE: ', value)
    setPeriod(value)
  }

  const chartTitle = props.chartTitle || `${ CONSTANTS.DISBURSEMENTS } (dollars)`

  const { loading, error, data } = useQuery(TOTAL_DISBURSEMENTS_QUERY)
  if (loading) {
    return 'Loading...'
  }
  let chartData
  let xAxis = 'year'
  const yAxis = 'sum'
  const yGroupBy = 'source'
  const units = 'dollars'
  let xLabels

  if (error) return `Error! ${ error.message }`
  if (data) {
    console.debug(data)
    if (toggle === 'month') {
      if (period === 'fiscal') {
        chartData = data.total_monthly_fiscal_disbursement2
      }
      else if (period === 'calendar') {
        chartData = data.total_monthly_calendar_disbursement2
      }
      else {
        chartData = data.last_twelve_disbursement2
      }
      xAxis = 'month_long'
      xLabels = (x, i) => {
        // console.debug(x)
        return x.map(v => v.substr(0, 3))
      }
    }
    else {
      chartData = data.total_yearly_fiscal_disbursement2
      xLabels = (x, i) => {
        return x.map(v => '\'' + v.toString().substr(2))
      }
    }
  }

  return (
    <>
      <Box color="secondary.main" mb={2} borderBottom={2} pb={1} className={classes.titleBar}>
        <Box component="h3" m={0} color="primary.dark">Disbursements</Box>
        <Box component="span" className={classes.titleLink}>
          <ExploreDataLink
            to="/query-data?dataType=Disbursements"
            icon="filter">Filter disbursements data</ExploreDataLink>
        </Box>
      </Box>
      <Grid container spacing={4}>
        <TotalDisbursementControls onToggleChange={toggleChange} onMenuChange={menuChange} maxFiscalYear={2019} maxCalendarYear={2020}/>
        <Grid item xs>
          <StackedBarChart
            title={chartTitle}
            units={units}
            data={chartData}
            xAxis={xAxis}
            yAxis={yAxis}
            yGroupBy={yGroupBy}
            xLabels={xLabels}
            legendFormat={v => {
              return utils.formatToDollarInt(v)
            }}
          />
        </Grid>
      </Grid>
    </>
  )
}

export default TotalDisbursements
