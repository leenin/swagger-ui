import React from 'react';
import {connect} from 'dva';

import ReactMarkdown from 'react-markdown/with-html'
import hljs from 'highlight.js'
import 'highlight.js/styles/rainbow.css';

import PropTypes from 'prop-types'
import router from 'umi/router';
import styles from './Header.css'
import {injectIntl, IntlProvider, FormattedMessage} from 'react-intl';
import Util from '@util/Util'

import DocSearchUI from './DocSearchUI'
import ToolbarUI from './ToolbarUI'

import {Row, Col, Modal, Button} from 'antd';


class Header extends React.Component {
    state = {
        visible: false,
        simpleDocInfo: null
    }

    constructor(props) {
        super(props);
        this.onDocSearch = this.onDocSearch.bind(this);
        this.onLanChagne = this.onLanChagne.bind(this);
        this.drawTitlePanel = this.drawTitlePanel.bind(this)
        this.drawProjectInfo = this.drawProjectInfo.bind(this)
        this.hideModalHandle = this.hideModalHandle.bind(this)
        this.testHandle = this.testHandle.bind(this);
        this.hmdCall = this.hmdCall.bind(this);
        this.autoHighlight = this.autoHighlight.bind(this);
    }

    hmdCall(dom){
        this.hmd=dom;
        this.autoHighlight();
    }

    autoHighlight(){
        if(this.hmd){
            this.hmd.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightBlock(block);
              });
        }
    }

    componentDidUpdate(){
        this.autoHighlight();
    }

    /**
     * 当组件的props改变时, 会被调用
     * @param nextProps 新的props
     */
    UNSAFE_componentWillReceiveProps(nextProps) {
        this.setState({
            simpleDocInfo: nextProps.simpleDocInfo
        })
    }

    async onDocSearch(docUrlHttpType, docUrlSuffix) {
        const {dispatch} = this.props;
        // 更新url也算更新全局状态
        router.replace(`/${docUrlHttpType}/${encodeURIComponent(docUrlSuffix)}`)
        // 执行这里也算更新全局状态
        dispatch({type: 'DocInfoModel/loadDocData', payload: {docUrlHttpType, docUrlSuffix}});
    }

    componentDidMount() {
        const {type, url, operateId, dispatch} = this.props;
        if (Util.strNotBlank(type) && Util.strNotBlank(url)) {
            dispatch({
                type: 'DocInfoModel/loadDocData',
                payload: {docUrlHttpType: type, docUrlSuffix: url, apiKey: operateId}
            })
        }
        this.autoHighlight();
    }

    onLanChagne(lanFlag) {
        const {dispatch} = this.props;
        dispatch({type: 'I18nModel/langChange', payload: lanFlag})
    }

    drawTitlePanel() {
        if (this.state.simpleDocInfo) {
            return (<div className={styles.title}
                         onClick={(e) => this.setState({visible: !this.state.visible})}>
                {this.state.simpleDocInfo.title}</div>)
        } else {
            return (<div className={styles.title}>API Doc</div>)
        }
    }

    drawProjectInfo() {
        const {simpleDocInfo} = this.state;
        if (simpleDocInfo) {
            const {formatMessage} = this.props.intl;
            return (<div className='projectInfo'>
                <div>
                <small>{simpleDocInfo.major?simpleDocInfo.major:'未注明负责人'}</small><small style={{float:'right'}}>{simpleDocInfo.version}</small>
                </div>
                <div className={'desc-panel'} ref={this.hmdCall}><ReactMarkdown source={simpleDocInfo.description?simpleDocInfo.description:'可以使用markdown语法编写项目详细说明!'} escapeHtml={false} /></div>
            </div>)
        } else {
            return '';
        }
    }

    hideModalHandle() {
        this.setState({
            visible: false
        })
    }

    testHandle(e){
        e.preventDefault()
        this.props.dispatch({type:'IndexModel/toggleDrawer'})
    }

    render() {
        const {type, url, I18nModel: {langArr}} = this.props;
        const {simpleDocInfo} = this.state;
        const {formatMessage} = this.props.intl;
        return (
            <div className='__header'>
                <Row className={styles.maxHeight}>
                    <Col span={5} className='maxHeight'>
                        {this.drawTitlePanel()}
                        <div className='__divider'></div>
                    </Col>
                    <Col span={19} className={styles.maxHeight}>
                        <div className={styles.docSearch}>
                            <DocSearchUI
                                onDocSearch={this.onDocSearch}
                                placeholder={formatMessage({id: 'doc_search'})} type={type} url={url}/>
                        </div>
                        <div className={styles.toolbar}><ToolbarUI langArr={langArr}
                                                                   onLanChagne={this.onLanChagne} onTestHandle={this.testHandle}></ToolbarUI>
                        </div>
                    </Col>
                </Row>
                <Modal
                    visible={this.state.visible}
                    title={this.state.simpleDocInfo?this.state.simpleDocInfo.title:formatMessage({id: 'api_doc_info'})}
                    onOk={this.hideModalHandle}
                    onCancel={this.hideModalHandle}
                >
                    {this.drawProjectInfo()}
                </Modal>
            </div>
        );
    }
}

Header.propTypes = {
    type: PropTypes.string,
    url: PropTypes.string,
    operateId: PropTypes.string,
}

const I18nHeader = injectIntl(Header)

// 复制全局state中的属性到组件的props中
function mapStateToProps(state) {
    return {I18nModel: state.I18nModel, simpleDocInfo: state.DocInfoModel.simpleDocInfo};
}

export default connect(mapStateToProps)(I18nHeader);
