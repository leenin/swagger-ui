import React, {Component} from 'react';
import {connect} from 'dva';
import {message as antdMessage, Button, Input, Form, Upload, Icon} from 'antd';
import {UnControlled as CodeMirror} from 'react-codemirror2';
import {FormattedMessage} from 'react-intl';

import Cookies from 'js-cookie'

// 将xml与json互换
import convert from 'xml-js'
// 将json转为FormData
import { objectToForm } from 'object-to-form';

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';

import PropTypes from 'prop-types'

import apiRemoteService from '@services/ApiRemoteService';

import Util from '@support/util/Util'

const FormItem = Form.Item;

class TestForm extends Component {

    constructor(props) {
        super(props);
        this.createHeaderParamFormItems = this.createHeaderParamFormItems.bind(this);
        this.createPathParamFormItems = this.createPathParamFormItems.bind(this);
        this.createFormParamFormItems = this.createFormParamFormItems.bind(this);
        this.createBodyParamFormItems = this.createBodyParamFormItems.bind(this);
        this.createFileUploadFormItem = this.createFileUploadFormItem.bind(this);
        this.buildObjectInitVal = this.buildObjectInitVal.bind(this);
        this.onSubmitForm = this.onSubmitForm.bind(this);
        this.buildResponsePanel = this.buildResponsePanel.bind(this);
        this.addFormParamMultipleItem = this.addFormParamMultipleItem.bind(this)
        const {clickedApi} = props;
        if (clickedApi.bodyParams.length > 0) {
            let reqData = {};
            for (const singleParam of clickedApi.bodyParams) {
                const paramName = singleParam.name;
                let initialValue = singleParam.default === '' ? singleParam.example : singleParam.default;
                if (initialValue === "" && 'undefined' !== typeof(singleParam.type) && null !== singleParam.type && singleParam.type.startsWith("array")) {
                    initialValue = [];
                }
                reqData[paramName] = initialValue;
            }
            let isJson = true;
            if(clickedApi.consumes){
                for(const single of clickedApi.consumes){
                    if(single.toLowerCase().indexOf('xml')>=0){
                        isJson = false;
                        break;
                    }
                }
            }
            let obj = {};
            if(isJson){
                obj = reqData;
            }else{
                obj[clickedApi.bodyName]=reqData;    
            }
            let codeVal = JSON.stringify(obj,null,3);
            if(!isJson){
                codeVal = convert.json2xml(obj,{compact: true, ignoreComment: true, spaces: 3});
            }
            this.state = {
                fileList: [],
                uploading: false,
                apiExecute: false,
                serverResp: '',
                multipleItemLength: {},
                '__bodyForm': codeVal
            };
        } else {
            this.state = {
                fileList: [],
                uploading: false,
                apiExecute: false,
                multipleItemLength: {},
                serverResp: ''
            }
        }
    }

    /**
     * 创建请求头表单项
     */
    createHeaderParamFormItems() {
        const {getFieldDecorator} = this.props.form;
        const {clickedApi} = this.props;
        if (clickedApi.headerParams && clickedApi.headerParams.length > 0) {
            const formItemArr = [];
            let key = 0;
            for (const singleParam of clickedApi.headerParams) {
                const paramName = singleParam.name;
                const required = singleParam.required;
                const message = required ? paramName + '是必须的!' : paramName;
                const initialValue = singleParam.default === '' ? singleParam.example : singleParam.default;
                const placeholder = singleParam.description;
                formItemArr.push(
                    <FormItem style={{marginBottom: 0}} key={'h-' + (++key)}>
                        {getFieldDecorator('__header.' + paramName, {
                            initialValue: initialValue,
                            rules: [{required: false, message: message}],
                        })(
                            <Input addonBefore={paramName} placeholder={placeholder}/>
                        )}
                    </FormItem>
                );
            }
            return (
                <div>
                    <h3 className='header'>
                        <FormattedMessage id="req_header"/>
                    </h3>
                    {formItemArr}
                </div>
            );
        } else {
            return '';
        }

    }


    /**
     * 创建路径参数表单项
     */
    createPathParamFormItems() {
        const {getFieldDecorator} = this.props.form;
        const {clickedApi} = this.props;
        if (clickedApi.pathParams && clickedApi.pathParams.length > 0) {
            const formItemArr = [];
            let key = 0;
            for (const singleParam of clickedApi.pathParams) {
                const paramName = singleParam.name + '*';
                const required = singleParam.required;
                const message = required ? paramName + '是必须的!' : paramName;
                const initialValue = singleParam.default === '' ? singleParam.example : singleParam.default;
                formItemArr.push(
                    <FormItem style={{marginBottom: 0}} key={'p-' + (++key)}>
                        {getFieldDecorator("__path." + paramName, {
                            initialValue: initialValue,
                            rules: [{required: singleParam.required, message: message}],
                        })(
                            <Input addonBefore={paramName}/>
                        )}
                    </FormItem>
                );
            }
            return (
                <div>
                    <h3 className='header'>
                        <FormattedMessage id="req_path"/>
                    </h3>
                    {formItemArr}
                </div>
            );
        } else {
            return '';
        }
    }

    addFormParamMultipleItem(paramName) {
        console.log(paramName)
        const length = this.state.multipleItemLength[paramName] ? this.state.multipleItemLength[paramName] + 1 : 2
        const multipleItemLength = this.state.multipleItemLength
        multipleItemLength[paramName] = length
        this.setState(multipleItemLength)
    }

    /**
     * 创建表单参数表单项
     * @param {function} getFieldDecorator
     */
    createFormParamFormItems() {
        const {getFieldDecorator} = this.props.form;
        const {clickedApi} = this.props;
        if (clickedApi.formParams && clickedApi.formParams.length > 0) {
            const formItemArr = [];
            let key = 0;
            for (const singleParam of clickedApi.formParams) {
                const paramName = singleParam.name;
                const required = singleParam.required;
                let addonBefore = null;
                if (required) {
                    addonBefore = <span className="myLabel">{singleParam.name}<i>*</i></span>
                } else {
                    addonBefore = <span>{singleParam.name}</span>
                }
                const message = required ? paramName + '是必须的!' : paramName;
                const initialValue = singleParam.default === '' ? singleParam.example : singleParam.default;
                // const isArray = singleParam.type === 'array';
                const isArray = singleParam.type.indexOf('array') != -1;
                const placeholder = singleParam.description;
                if (!isArray) {
                    formItemArr.push(
                        <FormItem style={{marginBottom: 0}} key={'f-' + (++key)}>
                            {getFieldDecorator('__form.' + paramName, {
                                initialValue: initialValue,
                                rules: [{required: singleParam.required, message: message}],
                            })(
                                <Input addonBefore={addonBefore} placeholder={placeholder}/>
                            )}
                        </FormItem>
                    );
                } else {
                    for (let index = 1; index <= (this.state.multipleItemLength[paramName] || 1); index++) {
                        formItemArr.push(
                            <FormItem style={{marginBottom: 0}} key={'f-' + (++key)}>
                                {getFieldDecorator('__form.' + paramName + '[' + index + ']', {
                                    initialValue: '',
                                    rules: [{required: singleParam.required, message: message}],
                                })(
                                    <Input addonBefore={paramName} placeholder={placeholder}/>
                                )}
                            </FormItem>
                        );
                    }
                    formItemArr.push(
                        <Button type="dashed" onClick={this.addFormParamMultipleItem.bind(this, paramName)} block key={'f-' + (++key)}>
                            <Icon type="plus" /> {paramName}
                        </Button>
                    )
                }
            }
            return (
                <div>
                    <h3 className='header'>
                        <FormattedMessage id="req_form"/>
                    </h3>
                    {formItemArr}
                </div>
            );
        } else {
            return '';
        }
    }

    buildObjectInitVal(obj) {
        let initVal = {};
        if(!obj.children){
            if(obj.type!=='object'){
                initVal = "" ;
            }
        }else{
            for (let i = 0; i < obj.children.length; i++) {
                const singleParam = obj.children[i];
                let paramVal;
                const paramName = singleParam.name;
                if (singleParam.type === 'object') {
                    paramVal = this.buildObjectInitVal(singleParam);
                } else if(typeof(singleParam.children)!=='undefined' && null!==singleParam.children && singleParam.children.length>0){
                    initialValue = [this.buildObjectInitVal(singleParam)];
                } else {
                    paramVal = singleParam.default === '' ? singleParam.example : singleParam.default;
                    if (paramVal === "" && 'undefined' !== typeof(singleParam.type) && null !== singleParam.type && singleParam.type.startsWith("array")) {
                        paramVal = [];
                    }
                }
                initVal[paramName] = paramVal;
            }
        }
        return initVal;
    }

    /**
     * 创建请求体参数表单项
     */
    createBodyParamFormItems() {
        const {clickedApi} = this.props;
        if (clickedApi.bodyParams && clickedApi.bodyParams.length > 0) {
            let reqData = {};
            
            for (const singleParam of clickedApi.bodyParams) {
                const paramName = singleParam.name;
                let initialValue;
                if (singleParam.type === 'object') {
                    initialValue = this.buildObjectInitVal(singleParam);
                } else if(typeof(singleParam.children)!=='undefined' && null!==singleParam.children && singleParam.children.length>0){
                    initialValue = [this.buildObjectInitVal(singleParam)];
                }else {
                    initialValue = singleParam.default === '' ? singleParam.example : singleParam.default;
                    if (initialValue === "" && 'undefined' !== typeof(singleParam.type) && null !== singleParam.type && singleParam.type.startsWith("array")) {
                        initialValue = [];
                    }
                }
                reqData[paramName] = initialValue;
            }

            let isJson = true;
            if(clickedApi.consumes){
                for(const single of clickedApi.consumes){
                    if(single.toLowerCase().indexOf('xml')>=0){
                        isJson = false;
                        break;
                    }
                }
            }
            let obj = {};
            if(isJson){
                obj = reqData;
            }else{
                obj[clickedApi.bodyName]=reqData;    
            }
            let codeVal = JSON.stringify(obj, null, 3);
            if(!isJson){
                codeVal = convert.json2xml(obj,{compact: true, ignoreComment: true, spaces: 3});
            }
            const that = this;
            return (
                <div>
                    <h3 className='header'>
                        <FormattedMessage id="req_body"/>
                    </h3>
                    <div>
                        <CodeMirror
                            value={codeVal}
                            options={{
                                mode: isJson?'json':'xml',
                                theme: 'dracula',
                                lineNumbers: true
                            }}
                            onChange={(editor, data, value) => {
                                that.setState({
                                    '__bodyForm': value
                                })
                            }}
                        />
                    </div>
                </div>
            );
        } else {
            return '';
        }
    }

    createFileUploadFormItem() {
        const {getFieldDecorator} = this.props.form;
        const formItemArr = [];
        const {clickedApi} = this.props;
        if (clickedApi.fileParams.length > 0) {

            const fileUploadProps = {
                onRemove: (file) => {
                    this.setState(({fileList}) => {
                        const index = fileList.indexOf(file);
                        const newFileList = fileList.slice();
                        newFileList.splice(index, 1);
                        return {
                            fileList: newFileList,
                        };
                    });
                },
                beforeUpload: (file) => {
                    this.setState(({fileList}) => ({
                        fileList: [...fileList, file],
                    }));
                    return false;
                },
                fileList: this.state.fileList
            };
            formItemArr.push(
                <Upload {...fileUploadProps} key={1}>
                    <Button>
                        <Icon type="upload"/> <FormattedMessage id="select_file"/>
                    </Button>
                </Upload>
            );
            return (
                <div>
                    <h3 className='header'>
                        <FormattedMessage id="file_upload"/>
                    </h3>
                    {formItemArr}
                </div>
            )
        } else {
            return '';
        }
    }

    onSubmitForm(e) {
        e.preventDefault();
        const that = this;
        that.setState({
            apiExecute: true
        })
        const clickedApi = this.props.clickedApi;
        let accept = "application/json";
        if(clickedApi.produces){
            for(const single of clickedApi.produces){
                if(single.indexOf('xml')>=0){
                    accept = "application/xml";
                    break;
                }
            }
        }
        
        let contentType = "application/json";
        let isUpload = false;
        if(typeof(clickedApi.fileParams)!=='undefined' && clickedApi.fileParams.length>0){
            contentType = "multipart/form-data"
            isUpload = true;
        }else if(clickedApi.consumes){
            for(const single of clickedApi.consumes){
                if(single.toLowerCase().indexOf('xml')>=0){
                    contentType = "application/xml";
                    break;
                }else if(single.toLowerCase().indexOf('x-www-form-urlencoded')>=0){
                    contentType = "application/x-www-form-urlencoded";
                    break;
                }
            }
        }

        const httpType = this.props.httpType;
        const apiUrlPrefix = this.props.apiUrlPrefix;
        const basePath = clickedApi.basePath;
        this.props.form.validateFields((err, values) => {
            if (err){
                antdMessage.error(err.__form[Object.getOwnPropertyNames(err.__form)[0]].errors[0].message)
                that.setState({
                    apiExecute: false
                })
                return
            }

            let testApiUrl = httpType + apiUrlPrefix + basePath;
            let tmpWebApiPath = Util.formReplacePathVar(clickedApi.path, values['__path']);
            var regEnd=new RegExp("/$");
            var regStart=new RegExp("^/");     
            if(regEnd.test(basePath) && regStart.test(tmpWebApiPath)){
                testApiUrl += tmpWebApiPath.substr(1);
            }else{
                testApiUrl += tmpWebApiPath;
            };
            if ('undefined' !== typeof (this.state['__bodyForm'])) {
                values['__bodyForm'] = this.state['__bodyForm'];
            }
            console.log(values);//__path, __header, __form, __bodyForm
            const printResponse = (result) => {
                if (typeof(result) === 'undefined') {
                    that.setState({
                        apiExecute: false,
                        serverResp: '服务器未给出任何响应. \r\n可能的原因: \r\n1.网络异常. \r\n2.服务器响应超时 \r\n3.客户端的超时时间设置过短 \r\n4.测试地址错误 \r\n5.后端服务未开启跨域支持'
                    })
                } else {
                    if(result.status===200||result.status===201){
                        antdMessage.info(testApiUrl+'   ===>  http响应状态码: '+result.status);
                        result['cookies']=Cookies.get();
                    }else{
                        antdMessage.error(testApiUrl+'  ===>  http响应状态码: '+result.status,10);
                        that.setState({
                            apiExecute: false
                        })
                    }
                    let isBinaryResult = false;
                    if(result.headers['content-type']){
                        if (-1 !== result.headers['content-type'].indexOf('octet-stream')
                            || -1 !== result.headers['content-type'].indexOf('excel')
                            || -1 !== result.headers['content-type'].indexOf('download')
                            || -1 !== result.headers['content-type'].indexOf('pdf')
                            || -1 !== result.headers['content-type'].indexOf('word')) {
                            isBinaryResult = true;
                        }
                    }
                    if (isBinaryResult) {
                        let url = window.URL.createObjectURL(new Blob([result.data]));
                        let link = document.createElement('a');
                        link.href = url;
                        let fileName = '后台返回的下载文件(未在content-disposition中找到文件名)';
                        let orignalFileName = null;
                        console.log(result.headers)
                        if (result.headers['content-disposition']) {
                            let tmp = result.headers['content-disposition'].replace(new RegExp("attachment;filename=", 'gm'), "");
                            if ('' !== tmp) {
                                fileName = decodeURI(tmp);
                                orignalFileName = tmp;
                            }
                        }
                        link.setAttribute('download', fileName);
                        link.setAttribute('id', 'real-download-file');
                        link.textContent = fileName;
                        let oldLink = document.getElementById('real-download-file');
                        if (oldLink) {
                            oldLink.remove();
                        }
                        document.getElementById('download-file').appendChild(link);
                        that.setState({
                            apiExecute: false
                        })
                    } else {
                        that.setState({
                            apiExecute: false,
                            serverResp: JSON.stringify(result, null, 3)
                        })
                    }
                }
            }
            
            let isBinaryResult = false;
            let isImageResult = false;
            if (clickedApi.produces) {
                for (const singleProducer of clickedApi.produces) {
                    if (-1 !== singleProducer.indexOf('octet-stream')
                        || -1 !== singleProducer.indexOf('excel')
                        || -1 !== singleProducer.indexOf('download')
                        || -1 !== singleProducer.indexOf('pdf')
                        || -1 !== singleProducer.indexOf('word')) {
                        isBinaryResult = true;
                    }else if(-1!==singleProducer.indexOf('image/jpeg')
                            || -1!==singleProducer.indexOf('image/png')){
                        isImageResult = true;
                    }
                }
            }
            if(isImageResult){
                if(clickedApi.method==='GET' || clickedApi.method==='get'){
                    isImageResult = true;
                }else{
                    isImageResult=false;
                }
            }
            let headers = values['__header'];
            if(!isUpload){
                if(headers){
                    headers={...headers,Accept:accept,'Content-Type':contentType}
                }else{
                    headers={Accept:accept,'Content-Type':contentType}
                }
            }
            if (clickedApi.method.toUpperCase() === 'POST') {
                if(isUpload){
                    // post文件上传
                    let previousFormData = new FormData();
                    this.state.fileList.forEach((file) => {
                        previousFormData.append(clickedApi.fileParams[0].name, file);
                    });
                    let normalFormData = typeof(values['__form'])!=='undefined'?values['__form']:{};
                    let formData = objectToForm(normalFormData, previousFormData);
                    apiRemoteService.postUpload(testApiUrl,formData,values['__header']).then(function (result) {
                        printResponse(result)
                    });
                } else if (Util.strNotBlank(values['__bodyForm'])) {
                    if(isBinaryResult){
                        // 这个实际上是post文件下载
                        apiRemoteService.normalBodyDownloadPost(testApiUrl, values['__bodyForm'], values['__header']).then(function (result) {
                            printResponse(result)
                        });
                    }else{
                        // post使用request body传参
                        apiRemoteService.normalBodyPost(testApiUrl, values['__bodyForm'], headers).then(function (result) {
                            printResponse(result)
                        });
                    }
                } else {
                    // post使用普通的表单传参
                    apiRemoteService.normalFormPost(testApiUrl, values['__form'], headers).then(function (result) {
                        printResponse(result)
                    });
                }
            } else if (clickedApi.method.toUpperCase() === 'GET') {
                if(isImageResult){
                    let oldImg = document.getElementById('image-content-image');
                    if (oldImg) {
                        oldImg.remove();
                    }
                    let realUrl = Util.convertRealUrl(testApiUrl, values['__form']);
                    let img = document.createElement('img');
                    img.src = realUrl;
                    img.setAttribute('id', 'image-content-image');
                    document.getElementById('image-content').append(img);
                    that.setState({
                        apiExecute: false
                    })
                }else{
                    apiRemoteService.normalGet(testApiUrl, values['__form'], headers).then(function (result) {
                        printResponse(result)
                    });
                }
            } else if (clickedApi.method.toUpperCase() === 'PUT') {
                if (Util.strNotBlank(values['__bodyForm'])) {
                    apiRemoteService.normalBodyPut(testApiUrl, values['__bodyForm'], headers).then(function (result) {
                        printResponse(result)
                    })
                } else {
                    apiRemoteService.normalFormPut(testApiUrl, values['__form'], headers).then(function (result) {
                        printResponse(result)
                    })
                }
            } else if (clickedApi.method.toUpperCase() === 'DELETE') {
                apiRemoteService.normalDelete(testApiUrl, values['__form'], headers).then(function (result) {
                    printResponse(result)
                })
            }
        });
    }

    codeMirrorRef(ref) {
        if (ref && ref.editor) {
            ref.editor.setSize('auto', '400px')
        }
    }



    buildResponsePanel(clickedApi) {
        let isBinaryResult = false;
        let isImageResult = false;
        if (clickedApi.produces) {
            for (const singleProducer of clickedApi.produces) {
                if (-1 !== singleProducer.indexOf('octet-stream')
                    || -1 !== singleProducer.indexOf('excel')
                    || -1 !== singleProducer.indexOf('download')
                    || -1 !== singleProducer.indexOf('pdf')
                    || -1 !== singleProducer.indexOf('word')) {
                    isBinaryResult = true;
                }else if(-1!==singleProducer.indexOf('image/jpeg')
                        || -1!==singleProducer.indexOf('image/png')){
                    isImageResult = true;
                }
            }
        }
        if(isImageResult){
            if(clickedApi.method==='GET' || clickedApi.method==='get'){
                isImageResult = true;
            }else{
                isImageResult=false;
            }
        }
        if (isBinaryResult) {
            return (
                <div>
                    <br/>
                    <div id="download-file"></div>
                </div>
            )
        } if(isImageResult){
            return (
                <div>
                    <br/>
                    <div id="image-content"></div>
                </div>
            )
        }else {
            return (
                <CodeMirror ref={this.codeMirrorRef}
                            value={this.state.serverResp}
                            options={{
                                mode: 'json',
                                theme: 'dracula',
                                readOnly: true,
                                lineNumbers: true
                            }}
                />
            )
        }
    }

    render() {
        const {getFieldDecorator} = this.props.form;
        const {httpType, apiUrlPrefix, clickedApi} = this.props;


        return (
            <div>
                <Form onSubmit={this.onSubmitForm}>

                    {this.createHeaderParamFormItems()}

                    {this.createPathParamFormItems()}

                    {this.createFormParamFormItems()}

                    {this.createFileUploadFormItem()}

                    {this.createBodyParamFormItems()}

                    <Button type="primary" htmlType="submit" block style={{marginTop: 10}}
                            loading={this.state.apiExecute}>
                        <FormattedMessage id="execute"/>
                    </Button>
                </Form>
                <h3 className='header'>
                    <FormattedMessage id="server_response"/>
                </h3>
                <div style={{height: 435, marginBottom: 20}}>
                    {this.buildResponsePanel(clickedApi)}
                </div>
            </div>
        );
    }
}

TestForm.propTypes = {
    httpType: PropTypes.string,
    apiUrlPrefix: PropTypes.string,
    clickedApi: PropTypes.object
}

export default Form.create()(TestForm);
