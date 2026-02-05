import React, { useState, useRef, useEffect } from 'react'
import { message } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import axios from 'axios'

const MusicContainer = styled.div`
  min-height: calc(100vh - 120px);
  padding: 20px;
  position: relative;
`

const PlayWrap = styled.div`
  width: 100%;
  max-width: 1000px;
  height: 600px;
  margin: 0 auto;
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
`

const SearchBar = styled.div`
  height: 60px;
  background-color: #1eacda;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 23px;
  position: relative;
  z-index: 11;

  .title {
    font-size: 20px;
    font-weight: 600;
    color: #fff;
  }

  .logo {
    width: 50px;
    height: 50px;
    border-radius: 50%;
  }

  input {
    width: 100%;
    max-width: 200px;
    height: 34px;
    border-radius: 17px;
    border: 0px;
    background: rgba(255, 255, 255, 0.45) url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="%23333" d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>') right 10px center no-repeat;
    padding-right: 35px;
    text-indent: 15px;
    outline: none;
    color: #333;
    font-size: 14px;

    &::placeholder {
      color: rgba(0, 0, 0, 0.4);
    }

    &:focus {
      background-color: rgba(255, 255, 255, 0.6);
    }
  }
`

const CenterCon = styled.div`
  height: 490px;
  background-color: rgba(255, 255, 255, 0.5);
  display: flex;
  justify-content: center;
  position: relative;
`

const SongWrapper = styled.div<{ show: boolean }>`
  width: 200px;
  height: 490px;
  box-sizing: border-box;
  padding: 10px;
  z-index: 1;
  display: ${props => props.show ? 'block' : 'none'};
`

const SongList = styled.ul`
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
  list-style: none;
  padding: 0;
  margin: 0;

  &::-webkit-scrollbar {
    display: none;
  }

  li {
    font-size: 12px;
    color: #333;
    height: 40px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    width: 180px;
    padding-left: 10px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:nth-child(odd) {
      background-color: rgba(240, 240, 240, 0.3);
    }

    &:hover {
      background-color: rgba(30, 172, 218, 0.3);
    }

    .play-icon {
      display: block;
      width: 17px;
      height: 17px;
      margin-right: 5px;
      position: relative;

      &.playing {
        &::before {
          content: '';
          position: absolute;
          left: 3px;
          top: 4px;
          width: 4px;
          height: 8px;
          background: #1eacda;
          border-radius: 2px;
          animation: pulse 1s ease-in-out infinite;
        }

        &::after {
          content: '';
          position: absolute;
          left: 10px;
          top: 4px;
          width: 4px;
          height: 8px;
          background: #1eacda;
          border-radius: 2px;
          animation: pulse 1s ease-in-out infinite 0.2s;
        }
      }

      &:not(.playing)::after {
        content: '';
        position: absolute;
        left: 6px;
        top: 5px;
        width: 0;
        height: 0;
        border-left: 5px solid #1eacda;
        border-top: 3px solid transparent;
        border-bottom: 3px solid transparent;
      }
    }

    b {
      font-weight: normal;
      width: 122px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #333;
      font-size: 12px;

      &.active {
        color: #1eacda;
        font-weight: 600;
        font-size: 15px;
      }
    }

    span {
      margin-left: auto;

      i {
        display: block;
        width: 23px;
        height: 17px;
        cursor: pointer;
        background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="%23333" d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .864l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/></svg>') center no-repeat;
        background-size: contain;
      }
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`

const CommentWrapper = styled.div`
  height: 490px;
  flex: 1;
  padding: 25px 10px;
  box-sizing: border-box;
  overflow: hidden;

  .title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    white-space: nowrap;
  }

  .comment-list {
    overflow: auto;
    height: 460px;
    margin-top: 30px;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 2px;
    }
  }

  dl {
    padding-top: 10px;
    padding-left: 55px;
    position: relative;
    margin-bottom: 20px;
  }

  dt {
    position: absolute;
    left: 4px;
    top: 10px;

    img {
      width: 40px;
      height: 40px;
      border-radius: 20px;
    }
  }

  dd {
    font-size: 12px;

    &.name {
      font-weight: bold;
      color: #333;
      padding-top: 5px;
    }

    &.detail {
      color: #666;
      margin-top: 5px;
      line-height: 18px;
    }
  }
`

const AudioCon = styled.div`
  height: 50px;
  background-color: #f1f3f4;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 20px;

  audio {
    width: 100%;
    height: 40px;
    outline: none;
  }
`

const VideoCon = styled.div<{ show: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  display: ${props => props.show ? 'block' : 'none'};

  video {
    position: fixed;
    width: 800px;
    height: 600px;
    left: 50%;
    top: 50%;
    margin-top: -300px;
    margin-left: -400px;
    z-index: 990;
  }

  .mask {
    position: fixed;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    z-index: 980;
    background-color: rgba(0, 0, 0, 0.8);
    cursor: pointer;
  }

  .close-btn {
    position: fixed;
    width: 40px;
    height: 40px;
    left: 50%;
    margin-left: 400px;
    margin-top: -300px;
    top: 50%;
    z-index: 995;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
  }
`

const LoadingCon = styled.div<{ show: boolean }>`
  width: 400px;
  height: 490px;
  display: ${props => props.show ? 'flex' : 'none'};
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 20;

  .loading-disc {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
    animation: rotate 2s linear infinite;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: repeating-radial-gradient(
        circle at center,
        transparent 0,
        transparent 2px,
        rgba(255, 255, 255, 0.03) 2px,
        rgba(255, 255, 255, 0.03) 4px
      );
    }

    &::after {
      content: '🎵';
      font-size: 48px;
    }
  }

  .loading-text {
    padding: 0 20px;
    margin-top: 30px;
    text-align: center;
    color: #333;
    font-size: 16px;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 0.4;
    }
    50% {
      opacity: 1;
    }
  }
`

interface SearchResult {
  id: number
  name: string
  artists: Array<{ name: string }>
  album: { name: string; picUrl: string }
  duration: number
  mvid: number
}

interface Comment {
  user: {
    nickname: string
    avatarUrl: string
  }
  content: string
}

const Music: React.FC = () => {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [musicList, setMusicList] = useState<SearchResult[]>([])
  const [musicUrl, setMusicUrl] = useState('')
  const [hotComments, setHotComments] = useState<Comment[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [showMV, setShowMV] = useState(false)
  const [mvUrl, setMvUrl] = useState('')
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasMusic, setHasMusic] = useState(false)
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1000)
  const audioRef = useRef<HTMLAudioElement>(null)

  // 监听屏幕尺寸变化
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // 搜索歌曲
  const searchMusic = async () => {
    if (!query.trim()) {
      message.warning(t('music.noKeywordTip'))
      return
    }

    try {
      const response = await axios.get(
        `/api/netease/search?keywords=${encodeURIComponent(query)}`
      )

      if (response.data?.result?.songs) {
        setMusicList(response.data.result.songs)
      } else {
        message.info(t('music.noResults'))
      }
    } catch (error) {
      message.error(t('music.searchFailed'))
    }
  }

  // 获取音乐URL
  const fetchMusicUrl = async (musicId: number) => {
    try {
      const levels = ['standard', 'higher', 'exhigh']

      for (const level of levels) {
        try {
          const response = await axios.get(
            `/api/netease/song/url/v1?id=${musicId}&level=${level}`
          )

          if (response.data?.data?.[0]?.url) {
            const url = response.data.data[0].url
            if (url && url.length > 10 && !url.includes('404')) {
              return url
            }
          }
        } catch (err) {
          continue
        }
      }

      return null
    } catch (error) {
      return null
    }
  }

  // 获取热门评论
  const fetchHotComments = async (musicId: number) => {
    try {
      const response = await axios.get(`/api/netease/comment/hot?type=0&id=${musicId}`)
      if (response.data?.hotComments) {
        return response.data.hotComments
      }
      return []
    } catch (error) {
      return []
    }
  }

  // 播放音乐
  const playMusic = async (musicId: number) => {
    setCurrentId(musicId)
    setLoading(true)
    setHasMusic(false)

    // 获取音乐URL
    const url = await fetchMusicUrl(musicId)
    if (!url) {
      message.error(t('music.searchFailed'))
      setLoading(false)
      return
    }

    // 获取评论
    const comments = await fetchHotComments(musicId)
    setHotComments(comments)

    setMusicUrl(url)
    setHasMusic(true)
    setLoading(false)

    // 播放
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.src = url
        audioRef.current.play()
      }
    }, 100)
  }

  // 播放MV
  const playMV = async (mvid: number) => {
    try {
      const response = await axios.get(`/api/netease/mv/url?id=${mvid}`)
      if (response.data?.data?.url) {
        setMvUrl(response.data.data.url)
        setShowMV(true)
      } else {
        message.warning(t('music.mvNotAvailable'))
      }
    } catch (error) {
      message.error(t('music.fetchMVFailed'))
    }
  }

  return (
    <MusicContainer>
      <PlayWrap>
        <SearchBar>
          <div className="title">{t('music.subTitle')}</div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('music.placeholder')}
            onKeyDown={(e) => e.key === 'Enter' && searchMusic()}
          />
        </SearchBar>

        <CenterCon>
          <SongWrapper show={musicList.length > 0}>
            <SongList>
              {musicList.map((item) => (
                <li
                  key={item.id}
                  onClick={() => playMusic(item.id)}
                >
                  <span className={`play-icon ${currentId === item.id && isPlaying ? 'playing' : ''}`} />
                  <b className={currentId === item.id ? 'active' : ''}>
                    {item.name}
                  </b>
                  {item.mvid > 0 && (
                    <span onClick={(e) => { e.stopPropagation(); playMV(item.mvid) }}>
                      <i />
                    </span>
                  )}
                </li>
              ))}
            </SongList>
          </SongWrapper>

          <LoadingCon show={((loading && !hasMusic) || (musicList.length >= 0 && hotComments.length === 0)) && (screenWidth >= 500 || musicList.length === 0)}>
            <div className="loading-disc" />
            <div className="loading-text">{t('music.description')}</div>
          </LoadingCon>

          {hasMusic && screenWidth >= 500 && (
            <CommentWrapper>
              <div className="title">{t('music.hotComments')}</div>
              <div className="comment-list">
                {hotComments.map((comment, index) => (
                  <dl key={index}>
                    <dt>
                      <img src={comment.user.avatarUrl} alt="" />
                    </dt>
                    <dd className="name">{comment.user.nickname}</dd>
                    <dd className="detail">{comment.content}</dd>
                  </dl>
                ))}
              </div>
            </CommentWrapper>
          )}
        </CenterCon>

        <AudioCon>
          <audio
            ref={audioRef}
            src={musicUrl}
            controls
            autoPlay
            loop
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </AudioCon>
      </PlayWrap>

      <VideoCon show={showMV}>
        <video src={mvUrl} controls autoPlay />
        <div className="mask" onClick={() => setShowMV(false)} />
        <div className="close-btn" onClick={() => setShowMV(false)}>
          <CloseOutlined />
        </div>
      </VideoCon>
    </MusicContainer>
  )
}

export default Music
