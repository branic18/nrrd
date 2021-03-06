import React from 'react'
import Explore from './Explore'
import { ExploreDataLink } from '../../layouts/IconLinks/ExploreDataLink'

const ExploreRevenue = props => {
  return (
    <Explore
      title="revenue"
      contentLeft={
        <>
          <ExploreDataLink to="/explore/#revenue" icon="data">
            Explore revenue data
          </ExploreDataLink>
          <ExploreDataLink to="/query-data/?dataType=Revenue" icon="filter">
            Query revenue data
          </ExploreDataLink>
          {/* <ExploreDataLink
            to="/how-revenue-works/federal-revenue-by-company/2018/"
            icon="data"
          >
            Revenue by company
          </ExploreDataLink> */}
        </>
      }
      contentCenter={
        <ExploreDataLink to="/how-revenue-works#understanding-federal-revenues" icon="works">
          How revenue works
        </ExploreDataLink>
      }
      contentRight={
        <ExploreDataLink to="/downloads/#Revenue" icon="download">
          Downloads and documentation
        </ExploreDataLink>
      }
    />
  )
}

export default ExploreRevenue
