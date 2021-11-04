import React, { Component } from "react";
import Loading from "./Loading";
import Panel from "./Panel";
import classnames from "classnames";
import axios from "axios";
import {
  getTotalInterviews,
  getLeastPopularTimeSlot,
  getMostPopularDay,
  getInterviewsPerDay
} from "helpers/selectors";
import { setInterview } from "helpers/reducers";

const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay
  }
];

class Dashboard extends Component {

  state = {
    days: [],
    appointments: {},
    interviewers: {},
    loading: true,
    focused: null
  }

  componentDidMount() {
    const focused = JSON.parse(localStorage.getItem("focused"));

    if (focused) {
      this.setState({ focused });
    }

    Promise.all([
      axios.get('/api/days'),
      axios.get('/api/appointments'),
      axios.get('/api/interviewers')
    ]).then(([days, appointments, interviewers]) => {
      this.setState({
        loading: false,
        days: days.data,
        appointments: appointments.data,
        interviewers: interviewers.data
      })
    })

    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL)

    this.socket.onmessage = event => {
      const data = JSON.parse(event.data);

      if (typeof data === "object" && data.type === "SET_INTERVIEW") {
        this.setState(previousState =>
          setInterview(previousState, data.id, data.interview)
        );
      }
    };

  }

  componentDidUpdate(previousProps, previousState) {
    if (previousState.focused !== this.state.focused) {
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
    }
  }

  componentWillUnmount() {
    this.socket.close();
  }

  selectPanel(id) {
    this.setState({
      focused: id
    });

    if (this.state.focused) {
      this.setState({
        focused: null
      })
    }

  }

  render() {
    const dashboardClasses = classnames("dashboard", {
      'dashboard--focused': this.state.focused
    });

    if (this.state.loading) {
      return <Loading />
    }

    const panelElements = data
      .filter(eachPanel => this.state.focused === null || this.state.focused === eachPanel.id
      )
      .map(eachPanel =>
        <Panel
          key={eachPanel.id}
          label={eachPanel.label}
          value={eachPanel.getValue(this.state)}
          onSelect={() => this.selectPanel(eachPanel.id)}
        />
      )

    return (
      <main className={dashboardClasses}>
        {panelElements}
      </main >
    )
  }
}

export default Dashboard;
