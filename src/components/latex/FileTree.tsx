import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Tree, Input, Button, Modal, message, Dropdown, Popconfirm, Upload } from 'antd'
import type { DataNode, TreeProps } from 'antd/es/tree'
import {
  FileTextOutlined,
  PictureOutlined,
  FileOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  FolderOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import './tree.css'

// 持久化的文件树存储，在模块级别保存
let persistedFiles: FileNode[] | null = null

export interface FileNode {
  key: string
  title: string
  type: 'tex' | 'bib' | 'cls' | 'image' | 'other' | 'folder'
  content?: string
  children?: FileNode[]
  url?: string
  imageBlob?: Blob  // 真实图片 Blob
  imageUrl?: string // base64 预览 URL
}

// File/Blob 转 base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// base64 转 Blob
const base64ToBlob = (base64: string): Blob => {
  const parts = base64.split(';base64,')
  const contentType = parts[0].split(':')[1]
  const raw = window.atob(parts[1])
  const rawLength = raw.length
  const uInt8Array = new Uint8Array(rawLength)
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i)
  }
  return new Blob([uInt8Array], { type: contentType })
}

const getFileIcon = (type: FileNode['type'], expanded?: boolean) => {
  switch (type) {
    case 'tex':
      return <FileTextOutlined style={{ color: '#667eea' }} />
    case 'bib':
      return <FileTextOutlined style={{ color: '#764ba2' }} />
    case 'cls':
      return <FileTextOutlined style={{ color: '#f59e0b' }} />
    case 'image':
      return <PictureOutlined style={{ color: '#10b981' }} />
    case 'folder':
      return expanded ? <FolderOpenOutlined style={{ color: '#fbbf24' }} /> : <FolderOutlined style={{ color: '#fbbf24' }} />
    default:
      return <FileOutlined />
  }
}

const getFileType = (filename: string): FileNode['type'] => {
  if (filename.endsWith('.tex')) return 'tex'
  if (filename.endsWith('.bib')) return 'bib'
  if (filename.endsWith('.cls')) return 'cls'
  if (/\.(png|jpg|jpeg|gif|svg|eps|bmp|webp)$/i.test(filename)) return 'image'
  return 'other'
}

const isImageFile = (filename: string): boolean => {
  return /\.(png|jpg|jpeg|gif|svg|eps|bmp|webp)$/i.test(filename)
}

const initialFiles: FileNode[] = [
  {
    key: 'main',
    title: 'main.tex',
    type: 'tex',
    content: `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{ctex}
\\usepackage{graphicx}
\\usepackage{amsmath}

\\title{我的第一篇 LaTeX 文档}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{简介}
这是使用 LaTeX 编写的示例文档。

\\section{数学公式}
著名的欧拉公式:
\\begin{equation}
e^{i\\pi} + 1 = 0
\\end{equation}

\\section{列表}
\\begin{itemize}
  \\item 第一项
  \\item 第二项
  \\item 第三项
\\end{itemize}

\\section{结论}
本文档展示了 LaTeX 的一些基本功能。

\\end{document}`,
  },
]

interface FileTreeProps {
  selectedKey: string | null
  onSelectFile: (key: string, content: string, imageBlob?: Blob) => void  // 修改：添加 imageBlob 参数
  onImagesChange?: (images: Array<{ key: string; name: string; blob: Blob }>) => void  // 新增：图片文件变化时的回调
}

interface TreeTitleProps {
  nodeKey: string
  title: string
  nodeType: FileNode['type']
  editingName: string
  editingKey: string | null
  onStartRename: (key: string) => void
  onDeleteFile: (key: string) => void
  onConfirmRename: () => void
  onEditingNameChange: (name: string) => void
}

const TreeNodeTitle: React.FC<TreeTitleProps> = ({
  nodeKey,
  title,
  nodeType,
  editingName,
  editingKey,
  onStartRename,
  onDeleteFile,
  onConfirmRename,
  onEditingNameChange,
}) => {
  const menuItems: MenuProps['items'] = [
    {
      key: 'rename',
      icon: <EditOutlined />,
      label: '重命名',
      onClick: (e) => {
        e.domEvent.stopPropagation()
        onStartRename(nodeKey)
      },
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: (
        <Popconfirm
          title={`确定要删除这个${nodeType === 'folder' ? '文件夹' : '文件'}吗？`}
          description={nodeType === 'folder' ? '删除后文件夹内的所有内容也将被删除' : ''}
          onConfirm={(e) => {
            e?.stopPropagation()
            onDeleteFile(nodeKey)
          }}
          okText="确定"
          cancelText="取消"
        >
          <span onClick={(e) => e.stopPropagation()}>删除</span>
        </Popconfirm>
      ),
    },
  ]

  if (editingKey === nodeKey) {
    return (
      <input
        autoFocus
        style={{
          width: '100%',
          border: '1px solid #1890ff',
          borderRadius: 2,
          outline: 'none',
          fontSize: 14,
          padding: '0 4px',
          boxSizing: 'border-box'
        }}
        value={editingName}
        onChange={(e) => onEditingNameChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onConfirmRename()
        }}
        onBlur={() => onConfirmRename()}
        onClick={(e) => e.stopPropagation()}
      />
    )
  }

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      width: '100%', 
      flex: 1,
      minWidth: 0,
      gap: 8
    }}>
      <span style={{ 
        flex: 1, 
        overflow: 'hidden', 
        textOverflow: 'ellipsis', 
        whiteSpace: 'nowrap',
        fontSize: 14
      }}>
        {title}
      </span>
      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
        <MoreOutlined
          onClick={(e) => e.stopPropagation()}
          style={{ 
            opacity: 0.5, 
            fontSize: 12, 
            flexShrink: 0,
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.5'
          }}
        />
      </Dropdown>
    </div>
  )
}

const FileTree: React.FC<FileTreeProps> = ({ selectedKey, onSelectFile, onImagesChange }) => {
  const [files, setFiles] = useState<FileNode[]>(() => {
    // 初始化时优先使用持久化的数据
    if (persistedFiles) return persistedFiles
    const savedFiles = localStorage.getItem('latex-file-tree-v3')
    if (savedFiles) {
      try {
        const parsed = JSON.parse(savedFiles)
        persistedFiles = parsed
        return parsed
      } catch (e) {
        console.error('加载文件树失败:', e)
      }
    }
    return initialFiles
  })
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [currentFolderKey, setCurrentFolderKey] = useState<string | null>(null)

  // 保存文件树（不保存 Blob，Blob 单独用 IndexedDB）
  useEffect(() => {
    const filesToSave = files.map(node => {
      // 从 localStorage 恢复文件内容
      const savedContent = localStorage.getItem(`latex-file-${node.key}`)
      // 如果是图片节点，保存 base64 数据到 localStorage
      if (node.type === 'image' && node.imageUrl) {
        localStorage.setItem(`latex-image-${node.key}`, node.imageUrl)
      }
      return {
        ...node,
        content: savedContent ?? node.content,
        imageBlob: undefined, // 不序列化 Blob
        imageUrl: node.type === 'image' ? node.imageUrl : undefined,
      }
    })
    persistedFiles = filesToSave
    localStorage.setItem('latex-file-tree-v3', JSON.stringify(filesToSave))
  }, [files])

  const findNode = useCallback((nodes: FileNode[], key: string): FileNode | null => {
    for (const node of nodes) {
      if (node.key === key) return node
      if (node.children) {
        const found = findNode(node.children, key)
        if (found) return found
      }
    }
    return null
  }, [])

  const findParentNode = useCallback((nodes: FileNode[], key: string, parent: FileNode | null = null): FileNode | null => {
    for (const node of nodes) {
      if (node.key === key) return parent
      if (node.children) {
        const found = findParentNode(node.children, key, node)
        if (found) return found
      }
    }
    return null
  }, [])

  const addNodeToParent = useCallback((currentNodes: FileNode[], parentKey: string | null, newNode: FileNode): FileNode[] => {
    if (parentKey === null) {
      return [...currentNodes, newNode]
    }
    
    return currentNodes.map((node) => {
      if (node.key === parentKey) {
        return {
          ...node,
          children: [...(node.children || []), newNode]
        }
      }
      if (node.children) {
        return {
          ...node,
          children: addNodeToParent(node.children, parentKey, newNode)
        }
      }
      return node
    })
  }, [])

  const deleteNode = useCallback((nodes: FileNode[], keyToDelete: string): FileNode[] => {
    return nodes.filter((node) => {
      if (node.key === keyToDelete) {
        // 清理图片 URL
        if (node.imageUrl) {
          URL.revokeObjectURL(node.imageUrl)
        }
        return false
      }
      if (node.children) {
        node.children = deleteNode(node.children, keyToDelete)
      }
      return true
    })
  }, [])

  const renameNode = useCallback((nodes: FileNode[], keyToRename: string, newName: string): FileNode[] => {
    return nodes.map((node) => {
      if (node.key === keyToRename) {
        return {
          ...node,
          title: newName,
          type: node.type === 'folder' ? 'folder' : getFileType(newName),
        }
      }
      if (node.children) {
        return {
          ...node,
          children: renameNode(node.children, keyToRename, newName)
        }
      }
      return node
    })
  }, [])

  const handleDeleteFile = useCallback((key: string) => {
    setFiles((prev) => deleteNode(prev, key))
    if (selectedKey === key) {
      onSelectFile('', '')
    }
    message.success('已删除')
  }, [deleteNode, selectedKey, onSelectFile])

  const handleStartRename = useCallback((key: string) => {
    const node = findNode(files, key)
    if (node) {
      setEditingKey(key)
      setEditingName(node.title)
    }
  }, [files, findNode])

  const handleConfirmRename = useCallback(() => {
    if (!editingKey || !editingName.trim()) {
      setEditingKey(null)
      return
    }

    setFiles((prev) => renameNode(prev, editingKey, editingName.trim()))
    setEditingKey(null)
    setEditingName('')
    message.success('重命名成功')
  }, [editingKey, editingName, renameNode])

  const handleSelect: TreeProps['onSelect'] = useCallback((selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      const key = selectedKeys[0] as string
      const node = findNode(files, key)

      if (node) {
        // 更新当前文件夹为选中节点的父文件夹
        const parentNode = findParentNode(files, key)
        setCurrentFolderKey(parentNode?.key || null)

        if (node.type !== 'folder') {
          if (node.type === 'image') {
            // 优先使用 localStorage 恢复图片（base64 格式）
            const savedImageUrl = localStorage.getItem(`latex-image-${key}`)
            const imageUrl = savedImageUrl || node.imageUrl || ''
            onSelectFile(key, `IMAGE:${imageUrl}`, node.imageBlob)
          } else {
            // 优先使用 localStorage 恢复文件内容
            const savedContent = localStorage.getItem(`latex-file-${key}`)
            onSelectFile(key, savedContent ?? node.content ?? '')
          }
        } else {
          onSelectFile(key, '')
        }
      }
    } else {
      setCurrentFolderKey(null)
    }
  }, [files, findNode, findParentNode, onSelectFile])

  const handleAddFile = useCallback(() => {
    if (!newFileName.trim()) {
      message.error('请输入文件名')
      return
    }

    const newFile: FileNode = {
      key: `file-${Date.now()}`,
      title: newFileName.trim(),
      type: getFileType(newFileName.trim()),
      content: '',
    }

    setFiles((prev) => addNodeToParent(prev, currentFolderKey, newFile))
    
    if (currentFolderKey && !expandedKeys.includes(currentFolderKey)) {
      setExpandedKeys([...expandedKeys, currentFolderKey])
    }
    
    setNewFileName('')
    setIsAddModalOpen(false)
    message.success('文件添加成功')
    onSelectFile(newFile.key, '')
  }, [newFileName, currentFolderKey, addNodeToParent, expandedKeys, onSelectFile])

  const handleAddFolder = useCallback(() => {
    if (!newFolderName.trim()) {
      message.error('请输入文件夹名称')
      return
    }

    const newFolder: FileNode = {
      key: `folder-${Date.now()}`,
      title: newFolderName.trim(),
      type: 'folder',
      children: [],
    }

    setFiles((prev) => addNodeToParent(prev, currentFolderKey, newFolder))
    
    if (currentFolderKey && !expandedKeys.includes(currentFolderKey)) {
      setExpandedKeys([...expandedKeys, currentFolderKey])
    }
    
    setNewFolderName('')
    setIsAddFolderModalOpen(false)
    message.success('文件夹创建成功')
  }, [newFolderName, currentFolderKey, addNodeToParent, expandedKeys])

  // 上传图片文件 - 使用 base64 存储，刷新后能恢复
  const handleImageUpload = useCallback(async (file: File) => {
    if (!isImageFile(file.name)) {
      message.error('请上传图片文件 (png, jpg, jpeg, gif, svg, eps, bmp, webp)')
      return false
    }

    if (file.size > 10 * 1024 * 1024) {
      message.error('图片大小不能超过10MB')
      return false
    }

    // 转为 base64
    const base64 = await blobToBase64(file)
    const key = `image-${Date.now()}-${file.name}`

    const newImageFile: FileNode = {
      key,
      title: file.name,
      type: 'image',
      imageBlob: file,           // 保留 Blob 用于编译
      imageUrl: base64,          // 使用 base64，刷新后能恢复
      content: base64,           // 兼容旧逻辑
      url: base64,
    }

    setFiles((prev) => addNodeToParent(prev, currentFolderKey, newImageFile))

    if (currentFolderKey && !expandedKeys.includes(currentFolderKey)) {
      setExpandedKeys([...expandedKeys, currentFolderKey])
    }

    message.success(`图片 "${file.name}" 上传成功`)
    onSelectFile(key, `IMAGE:${base64}`, file)

    return false
  }, [currentFolderKey, addNodeToParent, expandedKeys, onSelectFile])

  // 调试用 - 移入生产后删除
  useEffect(() => {
    console.log('files updated:', JSON.stringify(files.map(f => ({ key: f.key, title: f.title }))))
  }, [files])

  const treeData = useMemo((): DataNode[] => {
    const build = (nodes: FileNode[]): DataNode[] => {
      // @ts-ignore
      return nodes.map((node) => ({
        key: node.key,
        title: (
          <TreeNodeTitle
            nodeKey={node.key}
            title={node.title}
            nodeType={node.type}
            editingName={editingName}
            editingKey={editingKey}
            onStartRename={handleStartRename}
            onDeleteFile={handleDeleteFile}
            onConfirmRename={handleConfirmRename}
            onEditingNameChange={setEditingName}
          />
        ),
        icon: ({ expanded }: { expanded: boolean }) => getFileIcon(node.type, expanded),
        isLeaf: node.type !== 'folder',
        children: node.children ? build(node.children) : undefined,
      }))
    }
    return build(files)
  }, [files, editingName, editingKey, handleStartRename, handleDeleteFile, handleConfirmRename])

  const getCurrentFolderName = () => {
    if (!currentFolderKey) return ''
    const folder = findNode(files, currentFolderKey)
    return folder ? ` (到 "${folder.title}")` : ''
  }

  // 获取所有图片文件（用于编译）
  useEffect(() => {
    if (onImagesChange) {
      const collectImages = (nodes: FileNode[]): Array<{ key: string; name: string; blob: Blob }> => {
        const images: Array<{ key: string; name: string; blob: Blob }> = []
        for (const node of nodes) {
          if (node.type === 'image') {
            let blob = node.imageBlob
            // 如果没有 Blob 但有 base64，则转换
            if (!blob && node.imageUrl && node.imageUrl.startsWith('data:')) {
              blob = base64ToBlob(node.imageUrl)
            }
            if (blob) {
              images.push({
                key: node.key,
                name: node.title,
                blob
              })
            }
          }
          if (node.children) {
            images.push(...collectImages(node.children))
          }
        }
        return images
      }

      onImagesChange(collectImages(files))
    }
  }, [files, onImagesChange])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, width: '100%', boxSizing: 'border-box' }}>
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 4,
          flexShrink: 0,
          minWidth: 0
        }}
      >
        <span style={{ fontWeight: 600, color: '#333', flex: 1 }}>文件</span>
        <Button
          type="text"
          icon={<FolderOutlined />}
          size="small"
          onClick={() => setIsAddFolderModalOpen(true)}
          title="新建文件夹"
          style={{ flexShrink: 0 }}
        />
        <Button
          type="text"
          icon={<PlusOutlined />}
          size="small"
          onClick={() => setIsAddModalOpen(true)}
          title="新建文本文件"
          style={{ flexShrink: 0 }}
        />
        <Upload
          accept="image/png,image/jpg,image/jpeg,image/gif,image/svg,image/bmp,image/webp"
          showUploadList={false}
          beforeUpload={handleImageUpload}
          customRequest={() => {}}
        >
          <Button
            type="text"
            icon={<PictureOutlined />}
            size="small"
            title="上传图片"
            style={{ flexShrink: 0 }}
          />
        </Upload>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px', minHeight: 0 }}>
        <Tree
          showIcon
          selectedKeys={selectedKey ? [selectedKey] : []}
          expandedKeys={expandedKeys}
          onExpand={(keys) => setExpandedKeys(keys)}
          onSelect={handleSelect}
          treeData={treeData}
          style={{ width: '100%' }}
        />
      </div>

      <Modal
        title={`新建文本文件${getCurrentFolderName()}`}
        open={isAddModalOpen}
        onOk={handleAddFile}
        onCancel={() => {
          setIsAddModalOpen(false)
          setNewFileName('')
        }}
        okText="创建"
        cancelText="取消"
        zIndex={1100}
      >
        <Input
          placeholder="请输入文件名，如: main.tex, notes.txt"
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
          onPressEnter={handleAddFile}
          autoFocus
        />
        <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
          支持的文件类型: .tex, .bib, .cls, .txt 等文本文件
        </div>
      </Modal>

      <Modal
        title={`新建文件夹${getCurrentFolderName()}`}
        open={isAddFolderModalOpen}
        onOk={handleAddFolder}
        onCancel={() => {
          setIsAddFolderModalOpen(false)
          setNewFolderName('')
        }}
        okText="创建"
        cancelText="取消"
      >
        <Input
          placeholder="请输入文件夹名称"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onPressEnter={handleAddFolder}
          autoFocus
        />
      </Modal>
    </div>
  )
}

export default FileTree