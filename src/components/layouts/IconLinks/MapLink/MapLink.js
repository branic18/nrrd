import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
// import Link from '../../../utils/temp-link'

import { makeStyles } from '@material-ui/core/styles'
// import styles from './MapLink.module.scss'

import MapIcon from '-!svg-react-loader!../../../../img/svg/icon-us-map.svg'

const useStyles = makeStyles(theme => ({
  root: {
    '& svg': {
      fill: theme.palette.links.primary,
      verticalAlign: 'middle',
      marginRight: '8px',
    },
    '& span': {
      verticalAlign: 'baseline',
    }
  }
}))

const MapLink = props => {
  const classes = useStyles()
  return (
    <Link to={props.to} className={classes.root}>
      <MapIcon />
      <span>
        {props.children === undefined
          ? 'Data by state'
          : props.children}
      </span>
    </Link>
  )
}

MapLink.propTypes = {
  /** The url for the link */
  to: PropTypes.string,
}

export default MapLink
