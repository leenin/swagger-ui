import React, {Component} from 'react';

import Util from '@support/util/Util';
import PropTypes from 'prop-types'
import styles from './DocSearch.css'

import {Select, Input} from 'antd'

const InputGroup = Input.Group;
const Option = Select.Option;

// UI组件
class DocSearchUI extends Component {

    constructor(props) {
        super(props);
        this.state = {
            dataSourceArr: [],
            docUrlSuffix: props.url ? props.url : '', //doc文档url地址后缀
            docUrlHttpType: props.type ? props.type : '1',
            docUrlHttpTypeArr: [{
                flag: '1',
                val: 'http://'
            }, {
                flag: '2',
                val: 'https://'
            }]
        }
        this.onHandleChange = this.onHandleChange.bind(this)
        this.onHandleEnter = this.onHandleEnter.bind(this)
        this.onHttpTypeChange = this.onHttpTypeChange.bind(this)
    }

    /**
     * 当组件的props改变时, 会被调用
     * @param nextProps 新的props
     */
    UNSAFE_componentWillReceiveProps(nextProps) {

    }

    /**
     * 用于性能优化, 返回false时,表示组件不需要重新render, 返回true说明需要
     * @param nextProps 新props值
     * @param nextState 新state值
     */
    shouldComponentUpdate(nextProps, nextState) {
        if (nextState.docUrlSuffix !== this.state.docUrlSuffix || nextProps.placeholder !== this.props.placeholder) {
            return true;
        } else {
            return false;
        }
    }

    onHandleEnter() {
        const docUrlSuffix = this.state.docUrlSuffix
        const docUrlHttpType = this.state.docUrlHttpType
        if (Util.strNotBlank(docUrlSuffix)) {
            this.props.onDocSearch(docUrlHttpType, docUrlSuffix);
        }
    }

    onHttpTypeChange(value) {
        const docUrlSuffix = this.state.docUrlSuffix;
        const docUrlHttpType = value;
        if (Util.strNotBlank(docUrlSuffix)) {
            this.props.onDocSearch(docUrlHttpType, docUrlSuffix);
        }
        this.setState({
            docUrlHttpType
        })
    }

    onHandleChange(e) {
        let realVal = e.target.value.trim();

        this.setState({
            docUrlSuffix: realVal
        });
    }

    render() {
        const {docUrlHttpType, docUrlHttpTypeArr, docUrlSuffix} = this.state;
        const {placeholder} = this.props;
        return (
            <InputGroup compact>
                <Select defaultValue={docUrlHttpType} onChange={this.onHttpTypeChange}
                        className={styles.httTypeSelect}>
                    {docUrlHttpTypeArr.map((item, index) => (
                        <Option key={index} value={item.flag}>{item.val}</Option>
                    ))}
                </Select>
                <Input
                    style={{width: "calc(100% - 180px)"}}
                    onChange={this.onHandleChange}
                    onPressEnter={this.onHandleEnter}
                    placeholder={placeholder}
                    defaultValue={docUrlSuffix}
                ></Input>
            </InputGroup>
        );
    }

}

DocSearchUI.propTypes = {
    placeholder: PropTypes.string,
    onDocSearch: PropTypes.func,
    type: PropTypes.string,
    url: PropTypes.string
}

export default DocSearchUI;
